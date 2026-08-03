import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldPlus, Phone, Menu, X } from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Symptom Triage", path: "/symptoms" },
    { name: "Emergency", path: "/emergency", emergency: true },
    { name: "AI Assistant", path: "/chat" },
    { name: "Facilities", path: "/facilities" },
    { name: "Booking", path: "/booking" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#08060d]/90 backdrop-blur-xl border-b border-[#00dc33]/20 shadow-lg shadow-black/20"
          : "bg-[#08060d] border-b border-white/10"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00dc33] text-black shadow-lg shadow-[#00dc33]/30 transition-transform group-hover:scale-105">
            <ShieldPlus className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00dc33]">
                AFYAROOT
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#00dc33] animate-ping" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-white font-heading">
              Health Assist
            </h1>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                  link.emergency
                    ? isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    : isActive
                      ? "bg-[#00dc33] text-black shadow-md shadow-[#00dc33]/30"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Emergency Action */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="tel:999"
            className="flex items-center gap-2 rounded-full bg-red-600/20 border border-red-500/40 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-600 hover:text-white shadow-sm"
          >
            <Phone className="h-3.5 w-3.5 animate-bounce" />
            <span>999 Emergency</span>
          </a>
          <Link
            to="/admin/login"
            className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-bold text-white transition"
          >
            Portal Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex lg:hidden items-center justify-center p-2 rounded-xl bg-white/10 text-white border border-white/15"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#08060d]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-bold transition ${
                  link.emergency
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : isActive
                      ? "bg-[#00dc33] text-black"
                      : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <a
              href="tel:999"
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg"
            >
              <Phone className="h-4 w-4" />
              Call Emergency Services (999)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
