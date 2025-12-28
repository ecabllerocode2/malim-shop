// src/contexts/ProductsContext.jsx
import React, { createContext, useContext, useEffect, useReducer } from "react";
import { db } from "../credenciales"; // ajusta si tu path es ./credenciales
import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";

const ProductsContext = createContext();

const CACHE_KEY = "malim_products_v1";
const CACHE_TTL = 1000 * 60 * 10; // 10 min, ajusta si quieres otro TTL

const initialState = {
  products: [],
  byId: {},
  loading: false,
  error: null,
  lastFetched: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "SET_PRODUCTS": {
      const products = action.payload;
      const byId = products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
      return {
        ...state,
        loading: false,
        products,
        byId,
        lastFetched: Date.now(),
        error: null,
      };
    }
    case "SET_PRODUCT": {
      const p = action.payload;
      return {
        ...state,
        byId: { ...state.byId, [p.id]: p },
        products: state.products.some(x => x.id === p.id) ? state.products.map(x => x.id === p.id ? p : x) : [p, ...state.products],
      };
    }
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export const ProductsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // lee cache (stale-while-revalidate)
  useEffect(() => {
    const tryLoadCache = () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.products)) {
          dispatch({ type: "SET_PRODUCTS", payload: parsed.products });
          return true;
        }
      } catch (e) {
        // ignore cache errors
      }
      return false;
    };

    tryLoadCache();

    const fetchProducts = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        // Query SIMPLE sin orderBy (evita necesidad de índice compuesto)
        // Ordenaremos en memoria después
        const q = query(
          collection(db, "productos_public"),
          where("publishOnline", "==", true)
        );
        
        const snap = await getDocs(q);
        let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ordenar en memoria por dateAdded descendente
        arr.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        
        dispatch({ type: "SET_PRODUCTS", payload: arr });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: arr }));
        } catch (e) {}
      } catch (err) {
        console.error("Error al cargar productos:", err);
        dispatch({ type: "SET_ERROR", payload: err.message || String(err) });
      }
    };

    // Si había cache lo validamos en background; si no, fetch de inmediato
    fetchProducts();
  }, []);

  // fuerza recarga manual
  const refresh = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const q = query(
        collection(db, "productos_public"),
        where("publishOnline", "==", true)
      );
      const snap = await getDocs(q);
      let arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Ordenar en memoria por dateAdded descendente
      arr.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      
      dispatch({ type: "SET_PRODUCTS", payload: arr });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: arr }));
      } catch (e) {}
    } catch (err) {
      console.error("Error refreshing products:", err);
      dispatch({ type: "SET_ERROR", payload: err.message || String(err) });
    }
  };

  // acceso rápido por id (O(1) gracias a byId)
  const getProductById = (id) => state.byId[id] ?? null;

  // fallback: cargar un solo doc (una lectura) si no está en cache
  const fetchProductById = async (id) => {
    if (state.byId[id]) return state.byId[id];
    try {
      const ref = doc(db, "productos_public", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() };
        // Verificar que esté publicado
        if (p.publishOnline) {
          dispatch({ type: "SET_PRODUCT", payload: p });
          // opcional: actualizar localStorage (no obliga)
          try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.products = [p, ...parsed.products.filter(x => x.id !== p.id)];
              localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
            }
          } catch (e) {}
          return p;
        } else {
          throw new Error("Producto no disponible");
        }
      } else {
        throw new Error("Producto no encontrado");
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products: state.products,
        byId: state.byId,
        loading: state.loading,
        error: state.error,
        lastFetched: state.lastFetched,
        refresh,
        getProductById,
        fetchProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts debe usarse dentro de ProductsProvider");
  return ctx;
};