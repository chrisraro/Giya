import type React from "react"
import Image from "next/image"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ width = 40, height = 40, className = "" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/giya-logo.png" alt="Giya Logo" width={width} height={height} className="object-contain" />
      <span className="text-xl font-bold text-foreground">Giya</span>
    </div>
  )
}
