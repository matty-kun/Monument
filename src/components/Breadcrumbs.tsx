"use client";

import Link from 'next/link';
import React from 'react';

interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href ? <Link href={item.href} className="hover:text-monument-green hover:underline">{item.label}</Link> : <span className="font-semibold text-gray-700">{item.label}</span>}
            {index < items.length - 1 && <span className="text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;