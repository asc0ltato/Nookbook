"use client";



import { useState } from "react";

import { cn } from "@/lib/utils";

import { resolveAvatarUrl } from "@/lib/auth";



type UserAvatarProps = {

  avatar?: string | null;

  alt: string;

  initials: string;

  className?: string;

  imageClassName?: string;

  fallbackClassName?: string;

  fill?: boolean;

  width?: number;

  height?: number;

};



export function UserAvatar({

  avatar,

  alt,

  initials,

  className,

  imageClassName,

  fallbackClassName,

  fill = false,

  width,

  height,

}: UserAvatarProps) {

  const src = resolveAvatarUrl(avatar ?? undefined);

  const [failed, setFailed] = useState(false);



  if (!src || failed) {

    return (

      <div

        className={cn(

          "flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold",

          fill && "absolute inset-0 w-full h-full",

          fallbackClassName,

          className,

        )}

      >

        {initials}

      </div>

    );

  }



  return (

    <img

      src={src}

      alt={alt}

      referrerPolicy="no-referrer"

      width={fill ? undefined : width}

      height={fill ? undefined : height}

      className={cn(

        "object-cover",

        fill ? "absolute inset-0 w-full h-full" : "w-full h-full",

        imageClassName,

        className,

      )}

      onError={() => setFailed(true)}

    />

  );

}


