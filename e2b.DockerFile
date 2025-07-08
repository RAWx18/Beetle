# ───────────────────────────────────────────
# 1. Use the newest current Node image
#    (22 is the current release line as of May 2025)
# ───────────────────────────────────────────
FROM node:22-slim

# ───────────────────────────────────────────
# 2. Minimal OS tooling
# ───────────────────────────────────────────
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl git \
 && rm -rf /var/lib/apt/lists/*

# ───────────────────────────────────────────
# 7. Install additional development tools globally
# ───────────────────────────────────────────
RUN npm install -g next@latest eslint@latest

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# ───────────────────────────────────────────
# 3. Set working directory
# ───────────────────────────────────────────
WORKDIR /home/user/app

# ───────────────────────────────────────────
# 4. Copy the entire salient-ts template
# ───────────────────────────────────────────
COPY . /home/user/app/

# ───────────────────────────────────────────
# 5. Configure npm for better compatibility
# ───────────────────────────────────────────
RUN npm config set legacy-peer-deps true \
 && npm config set fund false \
 && npm config set audit false

# ───────────────────────────────────────────
# 6. Install dependencies from package.json
# ───────────────────────────────────────────
RUN npm install --legacy-peer-deps

RUN npm install --legacy-peer-deps motion tailwindcss-animate tw-animate-css tailwind-merge clsx lucide-react react-icons
RUN npm install --legacy-peer-deps react-fast-marquee cobe @tabler/icons-react react-rough-notation @headlessui/react react-intersection-observer
RUN npm install --save-dev eslint eslint-config-next
RUN npm install --save-dev @eslint/eslintrc
