import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between py-4 px-8 bg-white border-b border-gray-100">
      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
        DeUna<span className="text-green-500">!</span>
      </div>
      <Link
        href="/register"
        className="flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
      >
        <span>📝</span> Registrarse
      </Link>
    </header>
  );
}