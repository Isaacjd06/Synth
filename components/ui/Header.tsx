export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 z-10">
      <div className="h-full flex items-center px-6">
        <h1 className="text-xl font-semibold text-gray-100">
          Synth
        </h1>
        <div className="ml-4 h-6 w-px bg-gray-700" />
        <div className="ml-4 h-4 w-1 bg-[#194c92]" />
      </div>
    </header>
  );
}

