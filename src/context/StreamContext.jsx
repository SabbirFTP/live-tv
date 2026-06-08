import { createContext, useContext, useReducer, useCallback } from "react";
import { saveStreams } from "../script";

const StreamContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "SET_STREAMS":
      return { ...state, streams: action.payload };

    case "UPDATE_STREAM": {
      const streams = state.streams.map((s, i) =>
        i === action.index ? { ...s, ...action.patch } : s
      );
      saveStreams(streams);
      return { ...state, streams };
    }

    case "DELETE_STREAMS": {
      const ids = new Set(action.ids);
      const streams = state.streams.filter((_, i) => !ids.has(i));
      saveStreams(streams);
      return { ...state, streams };
    }

    case "DELETE_BY_STATUS": {
      const streams = state.streams.filter((s) => s.status !== action.status);
      saveStreams(streams);
      return { ...state, streams };
    }

    case "ADD_STREAMS": {
      const existing = new Set(state.streams.map((s) => s.url));
      const fresh = action.payload.filter((s) => !existing.has(s.url));
      const streams = [...state.streams, ...fresh];
      saveStreams(streams);
      return { ...state, streams };
    }

    case "CLEAR_STREAMS":
      saveStreams([]);
      return { ...state, streams: [] };

    default:
      return state;
  }
}

export function StreamProvider({ children, initialStreams = [] }) {
  const [state, dispatch] = useReducer(reducer, { streams: initialStreams });

  const setStreams = useCallback(
    (payload) => dispatch({ type: "SET_STREAMS", payload }),
    []
  );
  const updateStream = useCallback(
    (index, patch) => dispatch({ type: "UPDATE_STREAM", index, patch }),
    []
  );
  const deleteStreams = useCallback(
    (ids) => dispatch({ type: "DELETE_STREAMS", ids }),
    []
  );
  const deleteByStatus = useCallback(
    (status) => dispatch({ type: "DELETE_BY_STATUS", status }),
    []
  );
  const addStreams = useCallback(
    (payload) => dispatch({ type: "ADD_STREAMS", payload }),
    []
  );
  const clearStreams = useCallback(
    () => dispatch({ type: "CLEAR_STREAMS" }),
    []
  );

  return (
    <StreamContext.Provider
      value={{
        streams: state.streams,
        setStreams,
        updateStream,
        deleteStreams,
        deleteByStatus,
        addStreams,
        clearStreams,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}

export function useStreams() {
  return useContext(StreamContext);
}
