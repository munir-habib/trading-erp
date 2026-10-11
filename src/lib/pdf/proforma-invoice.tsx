import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { COMPANY_NAME, COMPANY_NIF } from "@/lib/company";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, borderBottomWidth: 1, borderColor: "#ccc", paddingBottom: 10 },
  companyName: { fontSize: 14, fontWeight: 700 },
  nif: { fontSize: 9, color: "#666" },
  title: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#333", paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderColor: "#ddd" },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  footer: { marginTop: 20, textAlign: "right", fontSize: 11, fontWeight: 700 },
});

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  currency: string;
}

export function ProformaInvoicePdf({
  reference,
  clientName,
  items,
}: {
  reference: string;
  clientName: string;
  items: InvoiceItem[];
}) {
  const total = items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0);
  const currency = items[0]?.currency ?? "EUR";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
          <Text style={styles.nif}>{COMPANY_NIF}</Text>
        </View>

        <Text style={styles.title}>Fatura Proforma</Text>
        <View style={styles.metaRow}>
          <Text>Referência: {reference}</Text>
          <Text>Data: {new Date().toLocaleDateString("pt-PT")}</Text>
        </View>
        <Text>Cliente: {clientName}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProduct}>Produto</Text>
            <Text style={styles.colQty}>Qtd</Text>
            <Text style={styles.colPrice}>Preço unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colProduct}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {item.unitPrice != null ? item.unitPrice.toFixed(2) : "—"}
              </Text>
              <Text style={styles.colTotal}>
                {item.unitPrice != null ? (item.unitPrice * item.quantity).toFixed(2) : "—"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Total: {total.toFixed(2)} {currency}
        </Text>
      </Page>
    </Document>
  );
}
