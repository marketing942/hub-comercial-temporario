import { redirect } from "next/navigation";

// A aba "Visao Geral" foi removida — redireciona pra Vendedores pra nao
// quebrar bookmarks nem redirecionamentos (middleware/login) que ainda
// apontam pra /admin.
export default function AdminIndex() {
  redirect("/admin/sellers");
}
