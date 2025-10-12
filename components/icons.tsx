import { ReactNode } from "react"

export function Icons() {
  return null
}

Icons.google = function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a10 10 0 0 0-10 10c0 4.42 3.58 8 8 8c.66 0 1.3-.09 1.9-.25l-.75-4.47c-.18.03-.36.05-.55.05c-1.66 0-3-1.34-3-3s1.34-3 3-3c.19 0 .37.02.55.05l.75-4.47A9.96 9.96 0 0 0 2 12a10 10 0 0 0 10-10z" />
    </svg>
  )
}

Icons.spinner = function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}