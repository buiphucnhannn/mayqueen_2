// Icon mạng xã hội (lucide không còn icon thương hiệu) — SVG inline, nhận className.

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  );
}

export function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z" />
    </svg>
  );
}

export function ZaloIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.5C6.5 2.5 2 6.4 2 11.2c0 2.7 1.4 5.1 3.6 6.7l-.6 3 3.2-1.6c1.2.4 2.5.6 3.8.6 5.5 0 10-3.9 10-8.7S17.5 2.5 12 2.5z" />
      <text
        x="12"
        y="13.6"
        textAnchor="middle"
        fontSize="6.4"
        fontWeight="800"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        Zalo
      </text>
    </svg>
  );
}

export function MessengerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.4 2 2 6.1 2 11.6c0 2.9 1.2 5.4 3.1 7.1v3.3l3-1.7c.9.3 1.9.4 2.9.4 5.6 0 10-4.1 10-9.6S17.6 2 12 2zm1 12.9-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.4 5.8z" />
    </svg>
  );
}
