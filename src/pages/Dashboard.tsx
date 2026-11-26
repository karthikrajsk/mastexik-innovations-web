import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";

export function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    CodesUtil.loadOnce(async () => {
      return await CodesAPI.getCodesHeader();
    });
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#fbf8f2] text-[#1c2b45] p-5 sm:p-8 lg:p-10 xl:p-12 font-sans box-border selection:bg-[#a9802a]/20">
      {/* Background ambient radial glow accents */}
      <div
        className="pointer-events-none absolute right-[-200px] top-[-200px] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(25,196,180,0.14), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-[-200px] bottom-[-200px] w-[720px] h-[720px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,179,106,0.22), transparent 70%)",
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto flex flex-col gap-10">
        {/* Top Header Bar: Date & Segmented Period Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="w-[38px] h-[1px] bg-[#a9802a]" />
            <span className="text-[11px] tracking-[0.26em] uppercase text-[#a9802a] font-semibold">
              Daily report · Thursday, 26 Nov 2026
            </span>
          </div>

          {/* Segmented Period Selector */}
          <div className="flex p-1 rounded-full bg-white border border-[#e6dcc6] shadow-sm">
            {(["today", "week", "month"] as const).map((tab) => {
              const active = period === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPeriod(tab)}
                  className={`px-4 sm:px-4.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 capitalize ${
                    active
                      ? "text-white shadow-sm"
                      : "text-[#5a6f8c] hover:text-[#1c2b45]"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(90deg, #0b2f78, #0e8f95)",
                        }
                      : {}
                  }
                >
                  {tab === "today" ? "Today" : tab === "week" ? "Week" : "Month"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Section: Gradient Banner with Wave Pattern & Key Metrics */}
        <section
          className="relative rounded-[34px] overflow-hidden text-white p-8 sm:p-11 lg:p-12 flex flex-col lg:flex-row items-stretch lg:items-center gap-8 lg:gap-0 shadow-[0_30px_60px_rgba(11,42,92,0.25)]"
          style={{
            background:
              "linear-gradient(120deg, #061a47 0%, #0b3a8c 60%, #0b7f86 100%)",
          }}
        >
          {/* Background Decorative Waves */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1328 300"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g fill="none" stroke="#9fe6ff">
              <path d="M-20 120 C300 -20 520 320 820 140 S1180 40 1360 120" strokeOpacity="0.07" strokeWidth="1.2" />
              <path d="M-20 127 C300 -15 520 323 820 145 S1180 46 1360 123" strokeOpacity="0.10" strokeWidth="1.2" />
              <path d="M-20 134 C300 -10 520 326 820 150 S1180 52 1360 126" strokeOpacity="0.13" strokeWidth="1.2" />
              <path d="M-20 141 C300 -5 520 329 820 155 S1180 58 1360 129" strokeOpacity="0.16" strokeWidth="1.2" />
              <path d="M-20 148 C300 0 520 332 820 160 S1180 64 1360 132" strokeOpacity="0.19" strokeWidth="1.2" />
              <path d="M-20 155 C300 5 520 335 820 165 S1180 70 1360 135" strokeOpacity="0.07" strokeWidth="1.2" />
              <path d="M-20 162 C300 10 520 338 820 170 S1180 76 1360 138" strokeOpacity="0.10" strokeWidth="1.2" />
              <path d="M-20 169 C300 15 520 341 820 175 S1180 82 1360 141" strokeOpacity="0.13" strokeWidth="1.2" />
              <path d="M-20 176 C300 20 520 344 820 180 S1180 88 1360 144" strokeOpacity="0.16" strokeWidth="1.2" />
              <path d="M-20 183 C300 25 520 347 820 185 S1180 94 1360 147" strokeOpacity="0.19" strokeWidth="1.2" />
              <path d="M-20 190 C300 30 520 350 820 190 S1180 100 1360 150" strokeOpacity="0.07" strokeWidth="1.2" />
              <path d="M-20 197 C300 35 520 353 820 195 S1180 106 1360 153" strokeOpacity="0.10" strokeWidth="1.2" />
              <path d="M-20 204 C300 40 520 356 820 200 S1180 112 1360 156" strokeOpacity="0.13" strokeWidth="1.2" />
              <path d="M-20 211 C300 45 520 359 820 205 S1180 118 1360 159" strokeOpacity="0.16" strokeWidth="1.2" />
              <path d="M-20 218 C300 50 520 362 820 210 S1180 124 1360 162" strokeOpacity="0.19" strokeWidth="1.2" />
              <path d="M-20 225 C300 55 520 365 820 215 S1180 130 1360 165" strokeOpacity="0.07" strokeWidth="1.2" />
              <path d="M-20 232 C300 60 520 368 820 220 S1180 136 1360 168" strokeOpacity="0.10" strokeWidth="1.2" />
              <path d="M-20 239 C300 65 520 371 820 225 S1180 142 1360 171" strokeOpacity="0.13" strokeWidth="1.2" />
              <path d="M-20 246 C300 70 520 374 820 230 S1180 148 1360 174" strokeOpacity="0.16" strokeWidth="1.2" />
              <path d="M-20 253 C300 75 520 377 820 235 S1180 154 1360 177" strokeOpacity="0.19" strokeWidth="1.2" />
              <path d="M-20 260 C300 80 520 380 820 240 S1180 160 1360 180" strokeOpacity="0.07" strokeWidth="1.2" />
              <path d="M-20 267 C300 85 520 383 820 245 S1180 166 1360 183" strokeOpacity="0.10" strokeWidth="1.2" />
              <path d="M-20 274 C300 90 520 386 820 250 S1180 172 1360 186" strokeOpacity="0.13" strokeWidth="1.2" />
              <path d="M-20 281 C300 95 520 389 820 255 S1180 178 1360 189" strokeOpacity="0.16" strokeWidth="1.2" />
              <path d="M-20 288 C300 100 520 392 820 260 S1180 184 1360 192" strokeOpacity="0.19" strokeWidth="1.2" />
              <path d="M-20 295 C300 105 520 395 820 265 S1180 190 1360 195" strokeOpacity="0.07" strokeWidth="1.2" />
            </g>
            <path
              d="M-20 230 C300 90 560 330 860 200 S1200 120 1360 180"
              stroke="#e2c27d"
              strokeWidth="2.4"
              fill="none"
            />
          </svg>

          {/* Left Hero Content: Woven today */}
          <div className="relative z-10 flex-[1.5] lg:pr-9">
            <div className="text-[11px] tracking-[0.24em] uppercase text-[#f1d9a0] font-semibold">
              Woven today
            </div>
            <div
              className="font-semibold text-[56px] sm:text-[72px] lg:text-[84px] leading-none my-2.5"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              18,420{" "}
              <span className="text-[24px] sm:text-[28px] lg:text-[32px] text-[#cfe0f3] font-normal">
                metres
              </span>
            </div>
            <div className="text-[14px] sm:text-[15px] text-[#cfe0f3]">
              92% of the daily plan ·{" "}
              <b className="text-[#7ff3e3] font-bold">+4.1%</b> vs yesterday
            </div>
          </div>

          {/* Stat 1: Orders */}
          <div className="relative z-10 lg:border-l lg:border-[rgba(232,201,135,0.35)] lg:px-7 pt-4 lg:pt-0">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#cfe0f3]">
              Orders
            </div>
            <div
              className="font-semibold text-[42px] sm:text-[48px] lg:text-[52px] leading-[1.1] text-white my-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              86
            </div>
            <div className="text-[12.5px] text-[#cfe0f3]">
              24 new · 62 repeat
            </div>
          </div>

          {/* Stat 2: Inwards */}
          <div className="relative z-10 lg:border-l lg:border-[rgba(232,201,135,0.35)] lg:px-7 pt-4 lg:pt-0">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#cfe0f3]">
              Inwards
            </div>
            <div
              className="font-semibold text-[42px] sm:text-[48px] lg:text-[52px] leading-[1.1] text-white my-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              6{" "}
              <span className="text-[18px] text-[#cfe0f3] font-normal font-sans">
                GRN
              </span>
            </div>
            <div className="text-[12.5px] text-[#cfe0f3]">
              12.4 t yarn received
            </div>
          </div>

          {/* Stat 3: Outwards */}
          <div className="relative z-10 lg:border-l lg:border-[rgba(232,201,135,0.35)] lg:px-7 pt-4 lg:pt-0">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#cfe0f3]">
              Outwards
            </div>
            <div
              className="font-semibold text-[42px] sm:text-[48px] lg:text-[52px] leading-[1.1] text-white my-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              14
            </div>
            <div className="text-[12.5px] text-[#cfe0f3]">
              9,860 m dispatched
            </div>
          </div>

          {/* Stat 4: Plan adherence circular gauge */}
          <div className="relative z-10 lg:border-l lg:border-[rgba(232,201,135,0.35)] lg:px-7 pt-4 lg:pt-0 flex items-center gap-4">
            <div className="relative w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] shrink-0">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 96 96"
                aria-hidden="true"
              >
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#e2c27d"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="236 252"
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div
                className="absolute inset-0 grid place-items-center font-semibold text-[26px] sm:text-[28px] text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                94%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#cfe0f3]">
                Plan adherence
              </div>
              <div className="text-[12.5px] text-[#cfe0f3] mt-1">
                112 / 128 looms booked
              </div>
            </div>
          </div>
        </section>

        {/* Section Row 1: Weaving production (I) & Orders pipeline (II) */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-14 items-start">
          {/* Section I: Weaving production */}
          <div>
            <div className="flex items-baseline gap-3.5 mb-1.5">
              <span
                className="font-semibold text-[15px] text-[#a9802a] tracking-[0.1em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                I.
              </span>
              <h2
                className="font-semibold text-[28px] sm:text-[30px] text-[#0b2a5c]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Weaving production
              </h2>
            </div>
            <div className="text-[13px] text-[#5a6f8c] mb-4">
              Fabric woven in metres, last seven days ·{" "}
              <span className="text-[#0e9a96] font-semibold">solid</span> actual,{" "}
              <span className="text-[#a9802a] font-semibold">dashed</span> plan
            </div>

            {/* Area Chart SVG */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 740 250"
                className="w-full min-w-[580px] h-[250px]"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="wa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#0e9a96" stopOpacity="0.30" />
                    <stop offset="1" stopColor="#0e9a96" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels */}
                <line x1="30" x2="720" y1="210" y2="210" stroke="#e9e1cf" />
                <text x="22" y="214" textAnchor="end" fill="#5a6f8c" fontSize="11">0k</text>

                <line x1="30" x2="720" y1="165" y2="165" stroke="#e9e1cf" />
                <text x="22" y="169" textAnchor="end" fill="#5a6f8c" fontSize="11">5k</text>

                <line x1="30" x2="720" y1="120" y2="120" stroke="#e9e1cf" />
                <text x="22" y="124" textAnchor="end" fill="#5a6f8c" fontSize="11">10k</text>

                <line x1="30" x2="720" y1="75" y2="75" stroke="#e9e1cf" />
                <text x="22" y="79" textAnchor="end" fill="#5a6f8c" fontSize="11">15k</text>

                <line x1="30" x2="720" y1="30" y2="30" stroke="#e9e1cf" />
                <text x="22" y="34" textAnchor="end" fill="#5a6f8c" fontSize="11">20k</text>

                {/* Shaded Area Fill */}
                <path
                  d="M50 64 C100 64 100 50 150 50 C200 50 200 97 250 97 C300 97 300 44 350 44 C400 44 400 56 450 56 C500 56 500 39 550 39 C600 39 600 44 650 44 L650 210 L50 210Z"
                  fill="url(#wa)"
                />

                {/* Dashed Gold Plan Line */}
                <path
                  d="M50 48 C100 48 100 48 150 48 C200 48 200 84 250 84 C300 84 300 48 350 48 C400 48 400 48 450 48 C500 48 500 48 550 48 C600 48 600 30 650 30"
                  fill="none"
                  stroke="#a9802a"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />

                {/* Solid Teal Actual Line */}
                <path
                  d="M50 64 C100 64 100 50 150 50 C200 50 200 97 250 97 C300 97 300 44 350 44 C400 44 400 56 450 56 C500 56 500 39 550 39 C600 39 600 44 650 44"
                  fill="none"
                  stroke="#0e9a96"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="50" cy="64" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="150" cy="50" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="250" cy="97" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="350" cy="44" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="450" cy="56" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="550" cy="39" r="4" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />
                <circle cx="650" cy="44" r="6" fill="#fff" stroke="#0e9a96" strokeWidth="2.5" />

                {/* Highlight Pill Tooltip for Today (Thu 26) */}
                <g>
                  <rect x="616" y="2" width="68" height="26" rx="13" fill="#0b2a5c" />
                  <text x="650" y="19" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
                    18,420 m
                  </text>
                </g>

                {/* X-axis labels */}
                <text x="50" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Fri 20</text>
                <text x="150" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Sat 21</text>
                <text x="250" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Sun 22</text>
                <text x="350" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Mon 23</text>
                <text x="450" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Tue 24</text>
                <text x="550" y="234" textAnchor="middle" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Wed 25</text>
                <text x="650" y="234" textAnchor="middle" fill="#a9802a" fontSize="11.5" fontWeight="700">Thu 26</text>
              </svg>
            </div>
          </div>

          {/* Section II: Orders pipeline */}
          <div>
            <div className="flex items-baseline gap-3.5 mb-1.5">
              <span
                className="font-semibold text-[15px] text-[#a9802a] tracking-[0.1em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                II.
              </span>
              <h2
                className="font-semibold text-[28px] sm:text-[30px] text-[#0b2a5c]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Orders pipeline
              </h2>
            </div>
            <div className="text-[13px] text-[#5a6f8c] mb-4">
              231 orders · ₹12.6 Cr open value
            </div>

            {/* Multi-segment Colored Bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-[3px] mb-4.5 bg-slate-100">
              <div style={{ width: "11.3%", background: "#a9802a" }} />
              <div style={{ width: "27.2%", background: "#d9b36a" }} />
              <div style={{ width: "40.4%", background: "#0e9a96" }} />
              <div style={{ width: "14.6%", background: "#2a6fd6" }} />
              <div style={{ width: "6.6%", background: "#7a4bc9" }} />
            </div>

            {/* Pipeline Stage Breakdown Rows */}
            <div className="flex flex-col">
              {/* Row 1: New */}
              <div className="flex items-center gap-3 py-2.5 border-t border-[#ece4d2]">
                <i className="w-2.5 h-2.5 rounded-full bg-[#a9802a] shrink-0" />
                <span className="flex-1 text-[14px] text-[#2b3f5c]">New</span>
                <b
                  className="font-semibold text-[22px] text-[#0b2a5c] w-11 text-right"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  24
                </b>
                <span className="w-11 text-right text-[12.5px] text-[#5a6f8c]">
                  11%
                </span>
              </div>

              {/* Row 2: Confirmed */}
              <div className="flex items-center gap-3 py-2.5 border-t border-[#ece4d2]">
                <i className="w-2.5 h-2.5 rounded-full bg-[#d9b36a] shrink-0" />
                <span className="flex-1 text-[14px] text-[#2b3f5c]">Confirmed</span>
                <b
                  className="font-semibold text-[22px] text-[#0b2a5c] w-11 text-right"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  58
                </b>
                <span className="w-11 text-right text-[12.5px] text-[#5a6f8c]">
                  27%
                </span>
              </div>

              {/* Row 3: In production */}
              <div className="flex items-center gap-3 py-2.5 border-t border-[#ece4d2]">
                <i className="w-2.5 h-2.5 rounded-full bg-[#0e9a96] shrink-0" />
                <span className="flex-1 text-[14px] text-[#2b3f5c]">In production</span>
                <b
                  className="font-semibold text-[22px] text-[#0b2a5c] w-11 text-right"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  86
                </b>
                <span className="w-11 text-right text-[12.5px] text-[#5a6f8c]">
                  40%
                </span>
              </div>

              {/* Row 4: Ready to ship */}
              <div className="flex items-center gap-3 py-2.5 border-t border-[#ece4d2]">
                <i className="w-2.5 h-2.5 rounded-full bg-[#2a6fd6] shrink-0" />
                <span className="flex-1 text-[14px] text-[#2b3f5c]">Ready to ship</span>
                <b
                  className="font-semibold text-[22px] text-[#0b2a5c] w-11 text-right"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  31
                </b>
                <span className="w-11 text-right text-[12.5px] text-[#5a6f8c]">
                  15%
                </span>
              </div>

              {/* Row 5: Dispatched */}
              <div className="flex items-center gap-3 py-2.5 border-t border-[#ece4d2]">
                <i className="w-2.5 h-2.5 rounded-full bg-[#7a4bc9] shrink-0" />
                <span className="flex-1 text-[14px] text-[#2b3f5c]">Dispatched</span>
                <b
                  className="font-semibold text-[22px] text-[#0b2a5c] w-11 text-right"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  14
                </b>
                <span className="w-11 text-right text-[12.5px] text-[#5a6f8c]">
                  7%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Row 2: Production planning (III) & Inwards & outwards (IV) */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-14 items-start">
          {/* Section III: Production planning */}
          <div>
            <div className="flex items-baseline gap-3.5 mb-1.5">
              <span
                className="font-semibold text-[15px] text-[#a9802a] tracking-[0.1em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                III.
              </span>
              <h2
                className="font-semibold text-[28px] sm:text-[30px] text-[#0b2a5c]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Production planning
              </h2>
            </div>
            <div className="text-[13px] text-[#5a6f8c] mb-4">
              Next fourteen days across weaving, brushing and dyeing · progress shown as filled bar
            </div>

            {/* Gantt / Schedule Timeline SVG */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 800 290"
                className="w-full min-w-[650px] h-[290px]"
                aria-hidden="true"
              >
                {/* Timeline Grid Lines & Date Labels */}
                <line x1="210" x2="210" y1="30" y2="280" stroke="#ece4d2" />
                <text x="230.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">25 Nov</text>

                <line x1="251" x2="251" y1="30" y2="280" stroke="#ece4d2" />
                <text x="271.5" y="20" textAnchor="middle" fill="#a9802a" fontSize="10.5" fontWeight="700">26</text>

                <line x1="292" x2="292" y1="30" y2="280" stroke="#ece4d2" />
                <text x="312.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">27</text>

                <line x1="333" x2="333" y1="30" y2="280" stroke="#ece4d2" />
                <text x="353.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">28</text>

                <line x1="374" x2="374" y1="30" y2="280" stroke="#ece4d2" />
                <text x="394.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">29</text>

                <line x1="415" x2="415" y1="30" y2="280" stroke="#ece4d2" />
                <text x="435.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">30</text>

                <line x1="456" x2="456" y1="30" y2="280" stroke="#ece4d2" />
                <text x="476.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">1 Dec</text>

                <line x1="497" x2="497" y1="30" y2="280" stroke="#ece4d2" />
                <text x="517.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">2</text>

                <line x1="538" x2="538" y1="30" y2="280" stroke="#ece4d2" />
                <text x="558.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">3</text>

                <line x1="579" x2="579" y1="30" y2="280" stroke="#ece4d2" />
                <text x="599.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">4</text>

                <line x1="620" x2="620" y1="30" y2="280" stroke="#ece4d2" />
                <text x="640.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">5</text>

                <line x1="661" x2="661" y1="30" y2="280" stroke="#ece4d2" />
                <text x="681.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">6</text>

                <line x1="702" x2="702" y1="30" y2="280" stroke="#ece4d2" />
                <text x="722.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">7</text>

                <line x1="743" x2="743" y1="30" y2="280" stroke="#ece4d2" />
                <text x="763.5" y="20" textAnchor="middle" fill="#5a6f8c" fontSize="10.5" fontWeight="500">8</text>

                {/* Today Column Highlight (26 Nov) */}
                <rect x="251" y="30" width="41" height="250" fill="rgba(217,179,106,0.12)" />
                <line x1="251" x2="251" y1="30" y2="280" stroke="#a9802a" strokeWidth="2" />

                {/* Row 1: SO-2411 Cotton Twill */}
                <text x="0" y="55" fill="#a9802a" fontSize="12" fontWeight="700">SO-2411</text>
                <text x="0" y="72" fill="#5a6f8c" fontSize="11.5">Cotton Twill · Weaving</text>
                <rect x="251" y="44" width="82" height="26" rx="13" fill="#0e9a96" fillOpacity="0.18" stroke="#0e9a96" strokeOpacity="0.5" />
                <rect x="251" y="44" width="64" height="26" rx="13" fill="#0e9a96" />
                <text x="341" y="61" fill="#0b2a5c" fontSize="11.5" fontWeight="600">78%</text>

                {/* Row 2: SO-2418 Poplin 60s */}
                <text x="0" y="103" fill="#a9802a" fontSize="12" fontWeight="700">SO-2418</text>
                <text x="0" y="120" fill="#5a6f8c" fontSize="11.5">Poplin 60s · Brushing</text>
                <rect x="251" y="92" width="123" height="26" rx="13" fill="#0e9a96" fillOpacity="0.18" stroke="#0e9a96" strokeOpacity="0.5" />
                <rect x="251" y="92" width="68" height="26" rx="13" fill="#0e9a96" />
                <text x="382" y="109" fill="#0b2a5c" fontSize="11.5" fontWeight="600">55%</text>

                {/* Row 3: SO-2420 Canvas Heavy */}
                <text x="0" y="151" fill="#a9802a" fontSize="12" fontWeight="700">SO-2420</text>
                <text x="0" y="168" fill="#5a6f8c" fontSize="11.5">Canvas Heavy · Weaving</text>
                <rect x="292" y="140" width="205" height="26" rx="13" fill="#e08a1e" fillOpacity="0.18" stroke="#e08a1e" strokeOpacity="0.5" />
                <rect x="292" y="140" width="66" height="26" rx="13" fill="#e08a1e" />
                <text x="505" y="157" fill="#0b2a5c" fontSize="11.5" fontWeight="600">32%</text>

                {/* Row 4: SO-2423 Satin Stripe */}
                <text x="0" y="199" fill="#a9802a" fontSize="12" fontWeight="700">SO-2423</text>
                <text x="0" y="216" fill="#5a6f8c" fontSize="11.5">Satin Stripe · Dyeing</text>
                <rect x="333" y="188" width="205" height="26" rx="13" fill="#0e9a96" fillOpacity="0.18" stroke="#0e9a96" strokeOpacity="0.5" />
                <rect x="333" y="188" width="25" height="26" rx="13" fill="#0e9a96" />
                <text x="546" y="205" fill="#0b2a5c" fontSize="11.5" fontWeight="600">12%</text>

                {/* Row 5: SO-2427 Denim 10 oz */}
                <text x="0" y="247" fill="#a9802a" fontSize="12" fontWeight="700">SO-2427</text>
                <text x="0" y="264" fill="#5a6f8c" fontSize="11.5">Denim 10 oz · Planned</text>
                <rect x="456" y="236" width="205" height="26" rx="13" fill="#2a6fd6" fillOpacity="0.18" stroke="#2a6fd6" strokeOpacity="0.5" />
                <rect x="456" y="236" width="0" height="26" rx="13" fill="#2a6fd6" />
                <text x="669" y="253" fill="#0b2a5c" fontSize="11.5" fontWeight="600">0%</text>
              </svg>
            </div>
          </div>

          {/* Section IV: Inwards & outwards */}
          <div>
            <div className="flex items-baseline gap-3.5 mb-1.5">
              <span
                className="font-semibold text-[15px] text-[#a9802a] tracking-[0.1em]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                IV.
              </span>
              <h2
                className="font-semibold text-[28px] sm:text-[30px] text-[#0b2a5c]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Inwards &amp; outwards
              </h2>
            </div>
            <div className="text-[13px] text-[#5a6f8c] mb-4">
              <span className="text-[#2a6fd6] font-semibold">Goods receipts</span> on the left,{" "}
              <span className="text-[#a9802a] font-semibold">dispatches</span> on the right
            </div>

            {/* Bi-directional Horizontal Bar Chart SVG */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 470 264"
                className="w-full min-w-[360px] h-[264px]"
                aria-hidden="true"
              >
                {/* Center Divider Line */}
                <line x1="215" x2="215" y1="6" y2="256" stroke="#d8cdb2" />

                {/* Fri 20 */}
                <text x="0" y="29" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Fri 20</text>
                <rect x="145" y="14" width="70" height="22" rx="11" fill="#2a6fd6" />
                <text x="137" y="30" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">5</text>
                <rect x="215" y="14" width="126" height="22" rx="11" fill="#d9b36a" />
                <text x="349" y="30" fill="#0b2a5c" fontSize="12" fontWeight="600">9</text>

                {/* Sat 21 */}
                <text x="0" y="65" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Sat 21</text>
                <rect x="159" y="50" width="56" height="22" rx="11" fill="#2a6fd6" />
                <text x="151" y="66" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">4</text>
                <rect x="215" y="50" width="154" height="22" rx="11" fill="#d9b36a" />
                <text x="377" y="66" fill="#0b2a5c" fontSize="12" fontWeight="600">11</text>

                {/* Sun 22 */}
                <text x="0" y="101" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Sun 22</text>
                <rect x="117" y="86" width="98" height="22" rx="11" fill="#2a6fd6" />
                <text x="109" y="102" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">7</text>
                <rect x="215" y="86" width="140" height="22" rx="11" fill="#d9b36a" />
                <text x="363" y="102" fill="#0b2a5c" fontSize="12" fontWeight="600">10</text>

                {/* Mon 23 */}
                <text x="0" y="137" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Mon 23</text>
                <rect x="145" y="122" width="70" height="22" rx="11" fill="#2a6fd6" />
                <text x="137" y="138" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">5</text>
                <rect x="215" y="122" width="168" height="22" rx="11" fill="#d9b36a" />
                <text x="391" y="138" fill="#0b2a5c" fontSize="12" fontWeight="600">12</text>

                {/* Tue 24 */}
                <text x="0" y="173" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Tue 24</text>
                <rect x="131" y="158" width="84" height="22" rx="11" fill="#2a6fd6" />
                <text x="123" y="174" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">6</text>
                <rect x="215" y="158" width="182" height="22" rx="11" fill="#d9b36a" />
                <text x="405" y="174" fill="#0b2a5c" fontSize="12" fontWeight="600">13</text>

                {/* Wed 25 */}
                <text x="0" y="209" fill="#5a6f8c" fontSize="11.5" fontWeight="500">Wed 25</text>
                <rect x="103" y="194" width="112" height="22" rx="11" fill="#2a6fd6" />
                <text x="95" y="210" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">8</text>
                <rect x="215" y="194" width="210" height="22" rx="11" fill="#d9b36a" />
                <text x="433" y="210" fill="#0b2a5c" fontSize="12" fontWeight="600">15</text>

                {/* Thu 26 */}
                <text x="0" y="245" fill="#a9802a" fontSize="11.5" fontWeight="700">Thu 26</text>
                <rect x="131" y="230" width="84" height="22" rx="11" fill="#2a6fd6" />
                <text x="123" y="246" textAnchor="end" fill="#0b2a5c" fontSize="12" fontWeight="600">6</text>
                <rect x="215" y="230" width="196" height="22" rx="11" fill="#d9b36a" />
                <text x="419" y="246" fill="#0b2a5c" fontSize="12" fontWeight="600">14</text>
              </svg>
            </div>
          </div>
        </section>

        {/* Section V: Module index (Horizontal Ledger Rows) */}
        <section className="mt-2">
          <div className="flex items-baseline gap-3.5 mb-1.5">
            <span
              className="font-semibold text-[15px] text-[#a9802a] tracking-[0.1em]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              V.
            </span>
            <h2
              className="font-semibold text-[28px] sm:text-[30px] text-[#0b2a5c]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Module index
            </h2>
            <span className="ml-auto text-[12px] text-[#5a6f8c]">
              Sample figures shown
            </span>
          </div>
          <div className="text-[13px] text-[#5a6f8c] mb-4">
            One line per module, so every department is visible at once
          </div>

          {/* Module Ledger Table Rows */}
          <div className="flex flex-col overflow-x-auto">
            {/* Row 1: Agency */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#a9802a]/40 text-[#a9802a] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2.5 20a6.5 6.5 0 0113 0" />
                    <circle cx="17" cy="9" r="2.5" />
                    <path d="M16 14.5a5 5 0 016 4.5" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Agency
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  ₹4.8 L
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Commission this month
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Active agents
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  32
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  New enquiries
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  18
                </div>
              </div>

              <div className="w-full">
                <svg viewBox="0 0 200 44" className="w-full h-11" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="l0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#a9802a" stopOpacity="0.22" />
                      <stop offset="1" stopColor="#a9802a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 30 C17 30 17 26 33 26 C50 26 50 27 67 27 C83 27 83 21 100 21 C117 21 117 23 133 23 C150 23 150 16 167 16 C183 16 183 13 200 13 L200 44 L0 44Z" fill="url(#l0)" />
                  <path d="M0 30 C17 30 17 26 33 26 C50 26 50 27 67 27 C83 27 83 21 100 21 C117 21 117 23 133 23 C150 23 150 16 167 16 C183 16 183 13 200 13" fill="none" stroke="#a9802a" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#e3f6ef] text-[#0b7f5a] text-[11.5px] font-semibold">
                  +11%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/agency/agency-contracts")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>

            {/* Row 2: Trading */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#0e9a96]/40 text-[#0e9a96] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 17l6-6 4 4 8-8" />
                    <path d="M15 7h6v6" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Trading
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  ₹2.1 Cr
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Turnover · month to date
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Trades today
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  48
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Avg margin
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  6.4%
                </div>
              </div>

              <div className="w-full">
                <svg viewBox="0 0 200 44" className="w-full h-11" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="l1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#0e9a96" stopOpacity="0.22" />
                      <stop offset="1" stopColor="#0e9a96" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 26 C17 26 17 28 33 28 C50 28 50 22 67 22 C83 22 83 24 100 24 C117 24 117 18 133 18 C150 18 150 20 167 20 C183 20 183 11 200 11 L200 44 L0 44Z" fill="url(#l1)" />
                  <path d="M0 26 C17 26 17 28 33 28 C50 28 50 22 67 22 C83 22 83 24 100 24 C117 24 117 18 133 18 C150 18 150 20 167 20 C183 20 183 11 200 11" fill="none" stroke="#0e9a96" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#e3f6ef] text-[#0b7f5a] text-[11.5px] font-semibold">
                  +7%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/transaction/sales-order-management")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>

            {/* Row 3: Store */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#2a6fd6]/40 text-[#2a6fd6] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-6 9 6v11H3z" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Store
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  ₹3.2 Cr
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Stock value on hand
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Low-stock items
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  12
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Pending issues
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  4
                </div>
              </div>

              <div className="w-full">
                <svg viewBox="0 0 200 44" className="w-full h-11" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="l2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#2a6fd6" stopOpacity="0.22" />
                      <stop offset="1" stopColor="#2a6fd6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 20 C17 20 17 20 33 20 C50 20 50 18 67 18 C83 18 83 19 100 19 C117 19 117 16 133 16 C150 16 150 17 167 17 C183 17 183 16 200 16 L200 44 L0 44Z" fill="url(#l2)" />
                  <path d="M0 20 C17 20 17 20 33 20 C50 20 50 18 67 18 C83 18 83 19 100 19 C117 19 117 16 133 16 C150 16 150 17 167 17 C183 17 183 16 200 16" fill="none" stroke="#2a6fd6" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#fde8e6] text-[#b4332a] text-[11.5px] font-semibold">
                  −3 items
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/masters/warehouse-master")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>

            {/* Row 4: Weaving */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#0e9a96]/40 text-[#0e9a96] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 9h16M4 15h16M9 4v16M15 4v16" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Weaving
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  91 %
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Loom efficiency today
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Looms running
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  118 / 128
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Maintenance
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  3
                </div>
              </div>

              <div className="w-full flex justify-end pr-8">
                <div className="relative w-12 h-12">
                  <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="19" fill="none" stroke="#e9e1cf" strokeWidth="5" />
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      fill="none"
                      stroke="#0e9a96"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="109 119"
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-[#0b2a5c]">
                    91%
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#e3f6ef] text-[#0b7f5a] text-[11.5px] font-semibold">
                  +2.1%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/transaction/weaving-contract-entry")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>

            {/* Row 5: Brushing */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#a9802a]/40 text-[#a9802a] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20c4 0 5-3 7-6l7-9 2 2-9 7c-3 2-6 3-7 6z" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Brushing
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  7,200 m
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Brushed output today
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Reject rate
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  1.8%
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Machines on
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  6 / 8
                </div>
              </div>

              <div className="w-full">
                <svg viewBox="0 0 200 44" className="w-full h-11" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="l4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#a9802a" stopOpacity="0.22" />
                      <stop offset="1" stopColor="#a9802a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 28 C17 28 17 23 33 23 C50 23 50 25 67 25 C83 25 83 20 100 20 C117 20 117 20 133 20 C150 20 150 16 167 16 C183 16 183 14 200 14 L200 44 L0 44Z" fill="url(#l4)" />
                  <path d="M0 28 C17 28 17 23 33 23 C50 23 50 25 67 25 C83 25 83 20 100 20 C117 20 117 20 133 20 C150 20 150 16 167 16 C183 16 183 14 200 14" fill="none" stroke="#a9802a" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#e3f6ef] text-[#0b7f5a] text-[11.5px] font-semibold">
                  +5%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/reports/brushing-stock-ledger")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>

            {/* Row 6: HR */}
            <div className="grid grid-cols-[200px_190px_130px_130px_1fr_96px_70px] min-w-[980px] items-center gap-5 py-4.5 border-t border-[#e6dcc6] border-b hover:bg-[#f6f0e4]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-full border border-[#2a6fd6]/40 text-[#2a6fd6] grid place-items-center bg-[#fffdf8] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0116 0" />
                  </svg>
                </div>
                <div
                  className="font-semibold text-[22px] text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  HR
                </div>
              </div>

              <div>
                <div
                  className="font-semibold text-[30px] leading-none text-[#0b2a5c]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  412 / 438
                </div>
                <div className="text-[12px] text-[#5a6f8c] mt-1">
                  Employees present today
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  On leave
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  11
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5a6f8c]">
                  Overtime hrs
                </div>
                <div className="font-bold text-[16px] text-[#0b2a5c] mt-0.5">
                  86
                </div>
              </div>

              <div className="w-full flex justify-end pr-8">
                <div className="relative w-12 h-12">
                  <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="19" fill="none" stroke="#e9e1cf" strokeWidth="5" />
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      fill="none"
                      stroke="#2a6fd6"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="112 119"
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-[#0b2a5c]">
                    94%
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#e3f6ef] text-[#0b7f5a] text-[11.5px] font-semibold">
                  94%
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/masters/shift-master")}
                className="text-[12px] font-semibold text-[#0b6f78] hover:text-[#0b2a5c] hover:underline text-right"
              >
                Open →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
