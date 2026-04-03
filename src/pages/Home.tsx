import { Hero } from "@/components/sections/Hero";
import { ProofBar } from "@/components/sections/ProofBar";
import { HomeTeaser } from "@/components/sections/HomeTeaser";
import { Trust } from "@/components/sections/Trust";
import { CTA } from "@/components/sections/CTA";

export function Home() {
  return (
    <>
      <Hero />
      <ProofBar />
      <HomeTeaser />
      <Trust />
      <CTA />
    </>
  );
}
