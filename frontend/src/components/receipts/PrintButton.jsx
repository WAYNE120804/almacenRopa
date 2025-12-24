import { printReceipt } from '../../utils/print';

const PrintButton = () => {
  return (
    <button
      type="button"
      className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
      onClick={printReceipt}
    >
      Imprimir
    </button>
  );
};

export default PrintButton;
