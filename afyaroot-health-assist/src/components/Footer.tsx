import { Link } from "react-router-dom";
import { ShieldPlus, Mail, Phone, MapPin, Heart, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#08060d] text-white border-t border-[#00dc33]/20 pt-16 pb-12 font-sans relative overflow-hidden">
      {/* Glow background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] bg-[#00dc33]/10 blur-[120px] rounded-full"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00dc33] text-black shadow-lg shadow-[#00dc33]/20">
                <ShieldPlus className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00dc33]">
                  AFYAROOT
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-white font-heading">
                  Health Assist
                </h2>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Empowering rural healthcare triage, intelligent emergency routing, verified hospital registry, and Community Health Unit coordination across Kenya.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#00dc33]/10 border border-[#00dc33]/20 px-3 py-1 text-xs font-bold text-[#00dc33]">
                <span className="h-2 w-2 rounded-full bg-[#00dc33] animate-pulse" />
                24/7 System Active
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00dc33] mb-4">
              Care Services
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/symptoms" className="hover:text-white transition flex items-center gap-1 group">
                  <span>AI Symptom Triage</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="hover:text-white transition flex items-center gap-1 group">
                  <span className="text-red-400">Emergency Dispatch</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-red-400" />
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-white transition flex items-center gap-1 group">
                  <span>Medical AI Chat Assistant</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-white transition flex items-center gap-1 group">
                  <span>KMHFR Facilities Registry</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition flex items-center gap-1 group">
                  <span>Hospital Bookings</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00dc33] mb-4">
              Platform & Support
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/contact" className="hover:text-white transition flex items-center gap-1 group">
                  <span>Contact Us</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition flex items-center gap-1 group">
                  <span>Language & Settings</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition flex items-center gap-1 group">
                  <span>CHU Admin Login</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition flex items-center gap-1 group">
                  <span>Health Officer Dashboard</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-[#00dc33]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00dc33] mb-4">
              Get In Touch
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#00dc33] shrink-0 mt-1" />
                <span>Ambwere Complex, Kakamega, Kenya</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#00dc33] shrink-0" />
                <a href="tel:+254704110727" className="hover:text-white transition">+254 704 110 727</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#00dc33] shrink-0" />
                <a href="mailto:support@fampesa.com" className="hover:text-white transition">support@fampesa.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AfyaRoot Health Assist. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for Kenyan Community Health & Rural Triage</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
