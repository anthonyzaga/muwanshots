import { Link } from 'react-router-dom';

export function GalleryBreadcrumbs({ category, album }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-[var(--text-muted)]">
        <li>
          <Link to="/gallery" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">Gallery</Link>
        </li>
        {category && (
          <>
            <li aria-hidden className="opacity-40">/</li>
            <li>
              {album ? (
                <Link to={`/gallery/${category.slug}`} className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">{category.name}</Link>
              ) : (
                <span aria-current="page" className="text-[var(--text-primary)] font-medium">{category.name}</span>
              )}
            </li>
          </>
        )}
        {album && (
          <>
            <li aria-hidden className="opacity-40">/</li>
            <li aria-current="page" className="text-[var(--text-primary)] font-medium">{album.title}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
