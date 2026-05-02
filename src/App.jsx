import React from 'react';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import Gallery from './sections/Gallery';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-luxury-black overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
