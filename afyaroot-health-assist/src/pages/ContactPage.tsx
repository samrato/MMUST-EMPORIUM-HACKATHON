import { useEffect, useState } from "react";
import { Mail, Phone, Building2, Clock, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

type FormData = {
  firstName: string;
  lastName: string;
  workEmail: string;
  phoneNumber: string;
  subject: string;
  message: string;
};

function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    workEmail: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | AfyaRoot Health Assist";
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        firstName: "",
        lastName: "",
        workEmail: "",
        phoneNumber: "",
        subject: "",
        message: "",
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <main className="relative min-h-screen bg-[#fcfbf9] font-sans selection:bg-[#00dc33] selection:text-black">
      {/* Atmosphere layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,220,51,0.06)_0%,rgba(0,220,51,0.02)_40%,rgba(245,243,234,0)_72%)] blur-3xl"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="fixed inset-x-0 top-0 z-50">
          <Header />
        </div>

        {/* Main Content */}
        <section className="flex-1 pt-24 pb-20 sm:pb-32 flex items-center justify-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1.3fr] lg:gap-20 items-start">
              {/* Left Column - Contact Information */}
              <div
                className="flex flex-col pt-2"
                style={{ animation: "fadeSlideUp 0.6s ease-out both" }}
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f4fbdf] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.05em] text-[#00dc33] border border-[#00dc33]/20">
                    <Phone className="h-3.5 w-3.5" />
                    Contact Us
                  </span>

                  <h1 className="mt-6 text-[3rem] md:text-[3.8rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#08060d]">
                    Get In Touch
                    <br />
                    With Our Team
                  </h1>

                  <p className="mt-5 text-[16px] leading-[1.6] text-[#08060d]/60 max-w-104 font-medium">
                    Fill out the contact form and our team will get back to you
                    within 1-2 business days.
                  </p>
                </div>

                {/* Contact Cards 2x2 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full max-w-lg">
                  {/* Head Office */}
                  <div className="rounded-[1.25rem] border border-slate-400/40 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2
                        className="h-[18px] w-[18px] text-[#00dc33]"
                        strokeWidth={2.5}
                      />
                      <h3 className="font-bold text-[#08060d] text-[15px]">
                        Head Office
                      </h3>
                    </div>
                    <p className="text-[14.5px] text-[#08060d]/60 font-medium leading-relaxed">
                      Ambwere Complex, Kakamega, Kenya
                    </p>
                  </div>

                  {/* Call Center */}
                  <div className="rounded-[1.25rem] border border-slate-400/40 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Phone
                        className="h-[18px] w-[18px] text-[#00dc33]"
                        strokeWidth={2.5}
                      />
                      <h3 className="font-bold text-[#08060d] text-[15px]">
                        Call Center
                      </h3>
                    </div>
                    <p className="text-[14.5px] text-[#08060d]/60 font-medium leading-relaxed">
                      +254704110727
                    </p>
                  </div>

                  {/* Email */}
                  <div className="rounded-[1.25rem] border border-slate-400/40 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail
                        className="h-[18px] w-[18px] text-[#00dc33]"
                        strokeWidth={2.5}
                      />
                      <h3 className="font-bold text-[#08060d] text-[15px]">
                        Email
                      </h3>
                    </div>
                    <p className="text-[14.5px] text-[#08060d]/60 font-medium leading-relaxed">
                      support@fampesa.com
                    </p>
                  </div>

                  {/* Working Hours */}
                  <div className="rounded-[1.25rem] border border-slate-400/40 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock
                        className="h-[18px] w-[18px] text-[#00dc33]"
                        strokeWidth={2.5}
                      />
                      <h3 className="font-bold text-[#08060d] text-[15px]">
                        Working Hours
                      </h3>
                    </div>
                    <p className="text-[14.5px] text-[#08060d]/60 font-medium leading-relaxed">
                      Monday - Friday <br /> (07 am - 05 pm)
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form Box */}
              <div
                style={{ animation: "fadeSlideUp 0.7s 0.15s ease-out both" }}
              >
                <div className="overflow-hidden rounded-2xl border border-slate-400/40 bg-white shadow-[0_24px_50px_rgba(8,6,13,0.04)]">
                  <div className="p-6 sm:p-8">
                    {submitted && (
                      <div className="mb-8 rounded-2xl border border-[#00dc33]/20 bg-[#00dc33]/10 p-4 flex items-start gap-4">
                        <CheckCircle2 className="h-6 w-6 text-[#00dc33] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-bold text-[#08060d] mb-1">
                            Message Sent!
                          </h4>
                          <p className="text-[14px] font-medium text-[#08060d]/70">
                            Thank you for reaching out. We will get back to you
                            as soon as possible.
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <h2 className="text-3xl font-bold text-[#00dc33] tracking-[-0.02em]">
                        Send us a message
                      </h2>
                      {/* Row 1: First & Last Name */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="mb-2 block text-[13px] font-bold text-[#08060d]"
                          >
                            FIRST NAME <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="lastName"
                            className="mb-2 block text-[13px] font-bold text-[#08060d]"
                          >
                            LAST NAME <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      {/* Row 2: Work Email & Phone Number */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="workEmail"
                            className="mb-2 block text-[13px] font-bold text-[#08060d]"
                          >
                            YOUR EMAIL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="workEmail"
                            name="workEmail"
                            value={formData.workEmail}
                            onChange={handleChange}
                            required
                            className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15"
                            placeholder="Enter work email"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="phoneNumber"
                            className="mb-2 block text-[13px] font-bold text-[#08060d]"
                          >
                            PHONE NUMBER
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            inputMode="numeric"
                            className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15"
                            placeholder="07... or +254..."
                          />
                        </div>
                      </div>

                      {/* Row 3: Subject */}
                      <div>
                        <label
                          htmlFor="subject"
                          className="mb-2 block text-[13px] font-bold text-[#08060d]"
                        >
                          SUBJECT <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15"
                          placeholder="Enter subject"
                        />
                      </div>

                      {/* Row 4: Message */}
                      <div>
                        <label
                          htmlFor="message"
                          className="mb-2 block text-[13px] font-bold text-[#08060d]"
                        >
                          MESSAGE <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full rounded-[0.8rem] border border-black/10 bg-transparent px-4 py-3.25 text-[14.5px] font-medium text-[#08060d] outline-none transition-all placeholder:text-black/30 focus:border-[#00dc33] focus:ring-[1px] focus:ring-[#00dc33]/15 resize-none"
                          placeholder="Enter message"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="group cursor-pointer mt-2 w-full relative overflow-hidden rounded-[0.8rem] bg-[#08060d] px-8 py-[15px] text-[15.5px] font-bold tracking-[-0.01em] text-white shadow-[0_8px_20px_rgba(8,6,13,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(8,6,13,0.22)]"
                      >
                        <span className="absolute inset-0 translate-y-full bg-[linear-gradient(135deg,#00dc33,#2a7a00)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
                        <span className="relative">SUBMIT</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </main>
  );
}

export default ContactPage;
