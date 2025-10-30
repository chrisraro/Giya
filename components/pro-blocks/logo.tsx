import type React from "react"
import Image from "next/image"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ width = 120, height = 40, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/Naga Perks Logo.png" alt="Naga Perks Logo" width={width} height={height} className="object-contain" />
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-muted-foreground">powered by</span>
        <div className="flex items-center gap-1.5">
          <Image src="/giya-logo.png" alt="Giya" width={20} height={20} className="object-contain" />
          <span className="text-sm font-semibold text-foreground">Giya</span>
        </div>
      </div>
    </div>
  )
}
