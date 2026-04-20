import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import client from '../api/client';
import { endpoints } from '../api/endpoints';

const rifaPathPattern = /^\/rifas\/([^/?#]+)/;

export const useRifaContext = () => {
  const location = useLocation();
  const rifaId = useMemo(() => {
    const match = location.pathname.match(rifaPathPattern);
    const id = match?.[1] || '';

    return id && id !== 'crear' ? id : '';
  }, [location.pathname]);

  const [state, setState] = useState({
    rifa: null as any,
    loading: false,
    error: null as string | null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!rifaId) {
      setState({ rifa: null, loading: false, error: null });
      return;
    }

    const loadRifa = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const { data } = await client.get(endpoints.rifaById(rifaId));

        if (!cancelled) {
          setState({ rifa: data, loading: false, error: null });
        }
      } catch (error: any) {
        if (!cancelled) {
          setState({ rifa: null, loading: false, error: error.message });
        }
      }
    };

    void loadRifa();

    return () => {
      cancelled = true;
    };
  }, [rifaId]);

  return {
    rifaId,
    isRifaScope: Boolean(rifaId),
    ...state,
  };
};
