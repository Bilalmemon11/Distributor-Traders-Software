import { useEffect, useState } from "react";
import Modal from "../Modal";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export default function CustomerPaymentHistoryModal({
  show,
  onHide,
  customer,
}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !customer) return;

    const load = async () => {
      setLoading(true);

      try {
        const res = await axios.get(
          `${API_BASE_URL}/customers/${customer.id}/payments`
        );

        setPayments(res.data.data || []);
      } catch (err) {
        console.error(err);
        setPayments([]);
      }

      setLoading(false);
    };

    load();
  }, [show, customer]);

  return (
    <Modal
      isOpen={show}
      onClose={onHide}
      title="Customer Payment History"
      size="xl"
    >
      {customer && (
        <div className="space-y-5">
          {/* Customer Info */}

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
            <h3 className="text-[#1e293b] text-lg font-semibold">
              {customer.name}
            </h3>

            <p className="text-[#64748b] mt-1">
              Phone : {customer.phone || "-"}
            </p>

            <p className="text-[#64748b]">
              Type : {customer.type || "-"}
            </p>

            <p className="text-amber-400 mt-2 font-medium">
              Outstanding :
              <span className="ml-2">{fmt(customer.balance)}</span>
            </p>
          </div>

          {/* Table */}

          <div className="overflow-x-auto border border-[#e2e8f0] rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1b2130] text-white">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Invoice No</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-center">Receipt</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading &&
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-[#e2e8f0]"
                    >
                      <td className="px-4 py-3">
                        {new Date(payment.date).toLocaleDateString("en-GB")}
                      </td>

                      <td className="px-4 py-3 text-green-600 font-medium">
                        {fmt(payment.amount)}
                      </td>

                      <td className="px-4 py-3">
                        {payment.invoice?.invoice_no || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {payment.notes || "-"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <a
                          href={`${API_BASE_URL}/customers/${customer.id}/payments/${payment.id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Receipt
                        </a>
                      </td>
                    </tr>
                  ))}

                {!loading && payments.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-8 text-gray-600"
                    >
                      No payment history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 mt-6">
            <a
              href={`${API_BASE_URL}/customers/${customer.id}/ledger`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg text-sm"
            >
              📄 Customer Ledger
            </a>

            <button
              onClick={onHide}
              className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
