import { useState } from "react";
import Topbar from "../components/Topbar";

import ReportFilters from "../components/reports/ReportFilters";
import ExportButtons from "../components/reports/ExportButtons";

import SalesReport from "../components/reports/SalesReport";
import PurchaseReport from "../components/reports/PurchaseReport";
import CustomerReport from "../components/reports/CustomerReport";
import VendorReport from "../components/reports/VendorReport";
import ExpenseReport from "../components/reports/ExpenseReport";
import InvoiceReport from "../components/reports/InvoiceReport";
import SaleReturnReport from "../components/reports/SaleReturnReport";
import PurchaseReturnReport from "../components/reports/PurchaseReturnReport";
import InventoryReport from "../components/reports/InventoryReport";
import OutstandingReceivableReport from "../components/reports/OutstandingReceivableReport";
import OutstandingPayableReport from "../components/reports/OutstandingPayableReport";
import AreaSalesReport from "../components/reports/AreaSalesReport";
import AreaRecoveryReport from "../components/reports/AreaRecoveryReport";
import SalesmenReport from "../components/reports/SalesmenReport";
import SupplyMenReport from "../components/reports/SupplyMenReport";
import FastMovingDeadStockReport from "../components/reports/FastMovingDeadStockReport";
import ExpiryAlertsReport from "../components/reports/ExpiryAlertsReport";

export default function Reports() {
  const [reportType, setReportType] = useState("sales");
  

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    month: "",
    year: new Date().getFullYear(),
    customer: "",
    vendor: "",
  });

  const renderReport = () => {
    switch (reportType) {
      case "sales":
        return <SalesReport filters={filters} />;

      case "velocity":
        return <FastMovingDeadStockReport filters={filters} />;

      case "expiry-alerts":
        return <ExpiryAlertsReport filters={filters} />;

      case "area-sales":
        return <AreaSalesReport filters={filters} />;

      case "area-recovery":
        return <AreaRecoveryReport filters={filters} />;

      case "salesmen":
        return <SalesmenReport filters={filters} />;

      case "supply-men":
        return <SupplyMenReport filters={filters} />;

      case "purchase":
        return <PurchaseReport filters={filters} />;

      case "customer":
        return <CustomerReport filters={filters} />;

      case "vendor":
        return <VendorReport filters={filters} />;

      case "expense":
        return <ExpenseReport filters={filters} />;

      case "invoice":
        return <InvoiceReport filters={filters} />;

      case "sale-return":
        return <SaleReturnReport filters={filters} />;

      case "purchase-return":
        return <PurchaseReturnReport filters={filters} />;

      case "inventory":
        return <InventoryReport filters={filters} />;

      case "outstanding-receivable":
        return <OutstandingReceivableReport filters={filters} />;

      case "outstanding-payable":
        return <OutstandingPayableReport filters={filters} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Reports" />

      <div className="p-6 space-y-6">

        <ReportFilters
          reportType={reportType}
          setReportType={setReportType}
          filters={filters}
          setFilters={setFilters}
        />


        {renderReport()}

      </div>
    </div>
  );
}
