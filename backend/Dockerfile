FROM node:22

RUN apt-get update && \
    apt-get install -y qemu-utils qemu-system-x86 qemu-kvm libvirt-clients libvirt-daemon-system  bash && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev -- --host 0.0.0.0"]
