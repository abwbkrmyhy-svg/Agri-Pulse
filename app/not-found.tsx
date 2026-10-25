import Link from "next/link";
import { Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-canopy-100 text-canopy-700">
        <Sprout size={30} />
      </span>
      <h2 className="mt-5 font-display text-[24px] font-semibold tracking-[-0.02em]">
        This field is fallow
      </h2>
      <p className="mt-2 text-sm text-[#5b6b61]">
        The page you were looking for does not exist. Head back to the farm overview.
      </p>
      <Link href="/" className="btn-primary mt-5">
        Back to overview
      </Link>
    </div>
  );
}
