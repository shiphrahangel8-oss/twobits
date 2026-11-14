import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const RouterContext = createContext(null);
const OutletContext = createContext(null);

export function BrowserRouter({ children }) {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  }));

  useEffect(() => {
    const onPopState = () => {
      setLocationState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    const targetUrl = String(to || '/');
    if (options.replace) {
      window.history.replaceState({}, '', targetUrl);
    } else {
      window.history.pushState({}, '', targetUrl);
    }
    const parsed = new URL(targetUrl, window.location.origin);
    setLocationState({
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    });
    if (!parsed.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const value = useMemo(() => ({ location: locationState, navigate }), [locationState]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.location : { pathname: '/', search: '', hash: '' };
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.navigate : () => {};
}

export function Link({ to, children, className, onClick, title, ...rest }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} className={className} title={title} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, children, className, onClick, title, ...rest }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  const computedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link to={to} onClick={onClick} className={computedClassName} title={title} {...rest}>
      {computedChildren}
    </Link>
  );
}

export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace]);
  return null;
}

export function Outlet() {
  const outletElement = useContext(OutletContext);
  return outletElement || null;
}

export function Route() {
  return null;
}

function normalizePath(p) {
  return ('/' + String(p || '').replace(/^\/+|\/+$/g, '')).replace(/\/+/g, '/');
}

export function Routes({ children }) {
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);

  const routeNodes = React.Children.toArray(children).filter(Boolean);

  for (const route of routeNodes) {
    const { path: routePath, element, children: nestedChildren } = route.props || {};

    // Nested parent route (e.g. path="/app")
    if (nestedChildren && routePath && routePath !== '*') {
      const prefix = normalizePath(routePath);
      if (currentPath === prefix || currentPath.startsWith(prefix + '/')) {
        const subPath = normalizePath(currentPath.slice(prefix.length) || '/');
        const nestedArray = React.Children.toArray(nestedChildren).filter(Boolean);

        let matchedChildElement = null;
        for (const childRoute of nestedArray) {
          if (childRoute.props?.index && (subPath === '/' || subPath === '')) {
            matchedChildElement = childRoute.props.element;
            break;
          }
          if (childRoute.props?.path) {
            const childPattern = normalizePath(childRoute.props.path);
            if (childPattern === subPath || childRoute.props.path === '*') {
              matchedChildElement = childRoute.props.element;
              break;
            }
          }
        }

        return <OutletContext.Provider value={matchedChildElement}>{element}</OutletContext.Provider>;
      }
    }

    // Exact top-level match
    if (routePath && routePath !== '*') {
      if (normalizePath(routePath) === currentPath) {
        return element;
      }
    }
  }

  // Wildcard fallback
  const wildcard = routeNodes.find((r) => r.props?.path === '*');
  return wildcard ? wildcard.props.element : null;
}
