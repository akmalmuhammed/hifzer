import { redirect } from "next/navigation";

export default function ReaderAliasPage() {
  redirect("/quran/read?view=compact");
}
