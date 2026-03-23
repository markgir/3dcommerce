import Link from 'next/link'
import { Printer, Github, Twitter, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-orange-400 mb-3">
              <Printer className="w-6 h-6" />
              <span>3D Print Hub</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              The platform for sharing free 3D printing models. Upload, discover, and download designs for your 3D printer.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="hover:text-white transition-colors">All Models</Link></li>
              <li><Link href="/explore?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link href="/explore?sort=popular" className="hover:text-white transition-colors">Most Downloaded</Link></li>
              <li><Link href="/explore?sort=likes" className="hover:text-white transition-colors">Most Liked</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join Us</Link></li>
              <li><Link href="/upload" className="hover:text-white transition-colors">Upload a Model</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">About</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2024 3D Print Hub. All models are free to download.
          </p>
          <p className="text-sm text-gray-500">
            Made with ❤️ for the 3D printing community
          </p>
        </div>
      </div>
    </footer>
  )
}
