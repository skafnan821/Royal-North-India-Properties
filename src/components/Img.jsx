import { useState } from 'react';
import { PLACEHOLDER } from '../data/seed';
import { normalizeImageUrl } from '../utils/images';

// Shows an owner's photo. If the link is empty, broken, or does not return an image
// (e.g. a web page), the branded placeholder is shown instead of a broken image or alt text.
export default function Img({ src, alt = '', ...rest }) {
  const [failed, setFailed] = useState(null);
  const url = normalizeImageUrl(src) || '';
  const broken = !!url && failed === url;
  return (
    <img
      src={!url || broken ? PLACEHOLDER : url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(url)}
      onLoad={(e) => { if (e.currentTarget.naturalWidth === 0) setFailed(url); }}
      {...rest}
    />
  );
}
