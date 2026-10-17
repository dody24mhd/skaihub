import { redirect } from "next/navigation";

// /blog is the same as /berita — permanent redirect for SEO
export default function BlogPage() {
  redirect("/berita");
}
