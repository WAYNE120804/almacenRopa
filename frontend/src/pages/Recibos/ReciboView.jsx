import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import ReceiptTicket from '../../components/receipts/ReceiptTicket';
import PrintButton from '../../components/receipts/PrintButton';

const ReciboView = () => {
  const { id } = useParams();
  const [state, setState] = useState({ receipt: null, vendor: null, loading: true, error: null });

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const { data } = await client.get(endpoints.reciboById(id));
        const vendorId = data?.payload?.vendedor_id;
        const vendorResponse = vendorId ? await client.get(endpoints.vendedorById(vendorId)) : null;
        setState({
          receipt: data,
          vendor: vendorResponse?.data || null,
          loading: false,
          error: null
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadReceipt();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Topbar title="Recibo" actions={<PrintButton />} />
      <div className="px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.receipt && <ReceiptTicket receipt={state.receipt} vendor={state.vendor} />}
      </div>
    </div>
  );
};

export default ReciboView;
