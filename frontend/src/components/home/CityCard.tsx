"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { normalizeCityImageUrl } from "@/lib/imageUtils";

interface CityCardProps {
  city: string;
  slug: string;
  image: string;
  priceFrom: number;
}

export const CityCard = ({ city, slug, image, priceFrom }: CityCardProps) => {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/hotels/${slug}`)}
      className="group relative h-[250px] rounded-2xl overflow-hidden cursor-pointer bg-black border border-gray-800 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500"
    >
      <div className="absolute inset-0">
        <Image 
          src={normalizeCityImageUrl(image)} 
          alt={city}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-600/0 to-yellow-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="relative h-full p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg group-hover:translate-x-1 transition-transform duration-300">
            {city}
          </h3>
          <div className="h-1 w-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full group-hover:w-16 transition-all duration-300" />
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-400 font-medium">от</span>
              <span className="text-2xl font-extrabold text-yellow-400 tracking-tight">
                {priceFrom > 0 ? priceFrom.toLocaleString() : '—'}
              </span>
              {priceFrom > 0 && <span className="text-xs text-gray-400 font-medium">BYN</span>}
            </div>
            <div className="text-[11px] text-gray-500 -mt-0.5">за ночь</div>
          </div>

          <div className="w-10 h-10 rounded-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/20 group-hover:border-yellow-500/50 group-hover:scale-110 transition-all duration-300">
            <ArrowRight className="w-4 h-4 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

