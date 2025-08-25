export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 mb-2 md:mb-0">
            © {new Date().getFullYear()} SIDLAK Intramurals – All Rights Reserved
          </div>
          <div className="text-sm text-gray-500">
            Made with ❤️ for NDMC
          </div>
        </div>
      </div>
    </footer>
  );
}
