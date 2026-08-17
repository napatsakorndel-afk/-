const fs = require('fs');
const css = `@import "tailwindcss";

/* Custom CSS classes for colorful background blocks, and action elements */
.bg-\\[\\#E25B45\\] .text-white,
.bg-\\[\\#CD4C37\\] .text-white,
.bg-blue-600 .text-white,
.bg-blue-500 .text-white,
.bg-\\[#7F1D1D\\] .text-white,
.bg-emerald-600 .text-white,
.bg-green-600 .text-white,
.bg-red-600 .text-white,
button .text-white,
button .text-white\\/80,
a.bg-\\[\\#E25B45\\] .text-white,
button,
button *,
a.bg-\\[#E25B45\\],
a.bg-\\[#E25B45\\] *,
.bg-\\[#E25B45\\],
.bg-\\[#E25B45\\] *,
.bg-\\[#CD4C37\\],
.bg-\\[#CD4C37\\] *,
.bg-blue-600,
.bg-blue-600 *,
.bg-blue-500,
.bg-blue-500 *,
.bg-\\[#7F1D1D\\],
.bg-\\[#7F1D1D\\] *,
.bg-emerald-600,
.bg-emerald-600 *,
.bg-emerald-500,
.bg-emerald-500 *,
.bg-green-600,
.bg-green-600 *,
.bg-red-600,
.bg-red-600 *,
[class*="bg-blue-"],
[class*="bg-blue-"] *,
[class*="bg-emerald-"],
[class*="bg-emerald-"] *,
[class*="bg-green-"],
[class*="bg-green-"] *,
[class*="bg-red-"],
[class*="bg-red-"] * {
  color: #ffffff !important;
}

/* Override all dark gradient sections to match LSEd 12 Years Warm style */
.bg-gradient-to-br.from-neutral-950,
.bg-gradient-to-br.from-zinc-950,
.bg-gradient-to-br.from-black,
.bg-gradient-to-r.from-neutral-950,
.bg-gradient-to-b.from-zinc-900,
.bg-gradient-to-br[class*="from-neutral-"],
.bg-gradient-to-br[class*="from-zinc-"],
.bg-gradient-to-br[class*="from-black-"] {
  background-image: none !important;
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
  box-shadow: 0 10px 30px -10px rgba(226, 91, 69, 0.08) !important;
}

/* Borders mapping to soft elegant peach-pink */
.border-white\\/10, .border-white\\/5, .border-white\\/20, .border-zinc-800 {
  border-color: #FFF0ED !important;
}

/* Specific Section: Landing Page Hero */
#landing-page section.relative.overflow-hidden {
  background-image: linear-gradient(to bottom right, #FFF5F2, #FFFBF0) !important; /* Soft warm pink-peach and yellow-gold */
  border-color: #FEE2E2 !important;
  color: #2D0F0F !important;
}

#landing-page section.relative.overflow-hidden h1 {
  color: #7F1D1D !important; /* Rich deep crimson */
  text-shadow: 0 2px 4px rgba(226, 91, 69, 0.04);
}

#landing-page section.relative.overflow-hidden p {
  color: #5C3A3A !important;
}

/* Hero icons/info badges */
#landing-page section.relative.overflow-hidden .bg-white\\/5 {
  background-color: #ffffff !important;
  border-color: #FFF0ED !important;
  box-shadow: 0 4px 12px rgba(226, 91, 69, 0.04) !important;
}

/* Hero register/status buttons */
#hero-status-btn {
  background-color: #ffffff !important;
  color: #E25B45 !important;
  border-color: #FCA5A5 !important;
}

#hero-status-btn:hover {
  background-color: #FFF5F2 !important;
  border-color: #E25B45 !important;
}

/* Countdown boxes */
#landing-page section:nth-child(2) {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
  box-shadow: 0 10px 30px -10px rgba(226, 91, 69, 0.05) !important;
}

#landing-page section:nth-child(2) p.text-white {
  color: #7F1D1D !important;
}

#landing-page section:nth-child(2) div.bg-black\\/40 {
  background-color: #FFF5F2 !important;
  border-color: #FFF0ED !important;
  box-shadow: none !important;
}

#landing-page section:nth-child(2) span {
  color: #E25B45 !important; /* Coral numbers */
}

/* Distance Category Cards */
#distances [id^="distance-card-"] {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
  box-shadow: 0 12px 30px -8px rgba(226, 91, 69, 0.05) !important;
}

#distances [id^="distance-card-"] .p-6.sm\\:p-8.bg-gradient-to-b {
  background-image: linear-gradient(to bottom, #FFF8F6, #ffffff) !important;
  border-bottom-color: #FFF0ED !important;
}

#distances [id^="distance-card-"] .bg-black\\/20 {
  background-color: #ffffff !important;
}

#distances [id^="distance-card-"] .bg-white\\/10 {
  background-color: #FFF5F2 !important;
  color: #7C4040 !important;
  border-color: #FEE2E2 !important;
}

/* Jersey Section */
#shirts {
  background-image: linear-gradient(to bottom right, #FFF8F6, #FFF1EE) !important;
  border-color: #FEE2E2 !important;
}

#shirts table {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
}

#shirts table th {
  background-color: #FFF8F6 !important;
  border-bottom-color: #FEE2E2 !important;
  color: #7F1D1D !important;
}

#shirts table td {
  border-bottom-color: #FFF0ED !important;
  color: #5C4040 !important;
}

#shirts .relative.bg-black\\/40 {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
  box-shadow: none !important;
}

#shirts .relative.bg-black\\/40 span {
  background-color: #E25B45 !important;
  color: #ffffff !important;
}

#shirts button.bg-zinc-900 {
  background-color: #FFF5F2 !important;
  border-color: #FCA5A5 !important;
  color: #E25B45 !important;
}

#shirts button.bg-zinc-900:hover {
  background-color: #FFF1EE !important;
}

/* Route Info and Map */
#info div {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
}

#info svg rect {
  fill: #FFF8F6 !important;
}

#info svg text {
  fill: #5C4040 !important;
}

#info svg text[fill="#ffffff"] {
  fill: #7F1D1D !important;
}

#info svg text[fill="#a7f3d0"] {
  fill: #15803d !important;
}

#info svg text[fill="#94a3b8"] {
  fill: #8C6F6F !important;
}

#info svg rect[fill="#1e3a8a"] {
  fill: #FFF5F2 !important;
  stroke: #E25B45 !important;
}

#info svg rect[fill="#065f46"] {
  fill: #f0fdf4 !important;
  stroke: #16a34a !important;
}

#info svg ellipse[fill="#1e293b"] {
  fill: #FFF1EE !important;
  stroke: #FCA5A5 !important;
}

#info svg path[stroke="#27272a"] {
  stroke: #FEE2E2 !important;
}

#info .absolute.bottom-2.right-2 {
  background-color: rgba(255,255,255,0.95) !important;
  color: #7C5E5E !important;
  border-color: #FEE2E2 !important;
}

/* Registration Wizard Form */
#registration-form-container {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
  box-shadow: 0 20px 40px -15px rgba(226, 91, 69, 0.08) !important;
}

#registration-form-container .bg-white\\/5 {
  background-color: #FFF8F6 !important;
  border-bottom-color: #FFF0ED !important;
}

#registration-form-container .bg-white\\/10 {
  background-color: #FEE2E2 !important;
}

#registration-form-container label.bg-white\\/5 {
  background-color: #ffffff !important;
  border-color: #FEE2E2 !important;
}

#registration-form-container label.bg-white\\/5:hover {
  border-color: #E25B45 !important;
  background-color: #FFFBFB !important;
}

#registration-form-container .border-b.border-white\\/5 {
  border-bottom-color: #FFF5F2 !important;
}

#registration-form-container .bg-black\\/20 {
  background-color: #FFF8F6 !important;
}

#registration-form-container button.bg-black\\/20 {
  background-color: #ffffff !important;
  border-color: #FCA5A5 !important;
  color: #E25B45 !important;
}

#registration-form-container button.bg-black\\/20:hover {
  background-color: #FFF5F2 !important;
  color: #CD4C37 !important;
}

/* Step list or active items indicators */
#registration-form-container div.bg-blue-500\\/10 {
  background-color: #FFF1EE !important;
}

#registration-form-container div.bg-yellow-500\\/10 {
  background-color: #FFFBEB !important;
}

#registration-form-container div.bg-purple-500\\/10 {
  background-color: #FFF5F5 !important;
}

/* Status Badges */
.bg-yellow-500\\/10 {
  background-color: #FFFBEB !important;
  color: #B45309 !important;
  border-color: #FDE68A !important;
}

.bg-blue-500\\/10 {
  background-color: #FFF1EE !important;
  color: #C2410C !important;
  border-color: #FCA5A5 !important;
}

.bg-emerald-500\\/10, .bg-green-500\\/10 {
  background-color: #ECFDF5 !important;
  color: #047857 !important;
  border-color: #A7F3D0 !important;
}

.bg-red-500\\/10 {
  background-color: #FEF2F2 !important;
  color: #B91C1C !important;
  border-color: #FCA5A5 !important;
}

/* Check tables and list items in admin portal */
table.w-full {
  background-color: #ffffff !important;
}

table.w-full thead {
  background-color: #FFF8F6 !important;
  color: #7F1D1D !important;
  border-bottom-color: #FCA5A5 !important;
}

table.w-full tbody tr {
  border-bottom-color: #FFF0ED !important;
}

table.w-full tbody tr:hover {
  background-color: #FFFBFB !important;
}

/* Scrollbars, table list backgrounds, drop shadows */
/* Let's make sure things like "รหัสสมัคร" and "BIB" show beautifully */
span.bg-white.text-black {
  background-color: #7F1D1D !important;
  color: #ffffff !important;
  border-color: #991B1B !important;
}

/* Admin modals */
.bg-neutral-900\\/95 {
  background-color: rgba(255, 255, 255, 0.99) !important;
  border-color: #FEE2E2 !important;
}
`;
fs.writeFileSync('src/index.css', css);
console.log('Restored index.css');
