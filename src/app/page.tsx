import App from "@/components/App"
import Header from "@/components/Header"


export default function Home() {
  return (
    <div>
      <Header/>
      <main className="text-center mt-5">
       <App/>
      </main>
    </div>
  );
}
