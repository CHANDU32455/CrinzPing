import Navbar from "./components/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div style={{ padding: "2rem" }}>{children}</div>
    </>
  );
}
