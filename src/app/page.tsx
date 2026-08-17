import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import About from "@/components/sections/About";
import Proof from "@/components/sections/Proof";
import Work from "@/components/sections/Work";
import Experience from "@/components/sections/Experience";
import Process from "@/components/sections/Process";
import Capabilities from "@/components/sections/Capabilities";
import Contact from "@/components/sections/Contact";
import WorldGate from "@/webgl/world/WorldGate";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="site-main">
        <Hero />
        <Manifesto />
        <About />
        <Proof />
        <Work />
        <Experience />
        <Process />
        <Capabilities />
        <Contact />
      </main>
      <WorldGate />
      <Footer />
    </>
  );
}
