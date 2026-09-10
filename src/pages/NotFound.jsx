import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
export default function NotFound() {
  useDocumentTitle('Page not found - Muwan Shots', 'The page you are looking for does not exist.');
  return (
    <>
      <Container className="py-16 sm:py-24">
        <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[var(--accent)]">404 - Not Found</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight">Looks like this moment got away.</h1>
          <p className="mt-3 text-[var(--text-muted)] leading-relaxed">The page you’re looking for doesn’t exist - or it moved. Let’s get you back to the story.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center h-11 px-7 rounded-full bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-sm">Back Home</Link>
            <Link to="/gallery" className="inline-flex items-center justify-center h-11 px-7 rounded-full border border-[var(--border)] bg-[var(--surface)] font-medium text-sm">Explore Gallery</Link>
          </div>
        </Card>
      </Container>
    </>
  );
}
