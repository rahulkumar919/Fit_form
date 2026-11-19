/** Decorative water background for the admin area (light blobs, caustics, waves). */
export function WaterBackdrop() {
  return (
    <>
      <span aria-hidden className="admin-caustics" />
      {/* saturated blobs give the frosted glass something to refract */}
      <span aria-hidden className="admin-orb admin-float -left-20 top-24 size-[28rem] bg-white" />
      <span aria-hidden className="admin-orb admin-float-slow right-[8%] top-[6%] size-[24rem] bg-cyan-200" />
      <span aria-hidden className="admin-orb admin-float left-[38%] top-[38%] size-[22rem] bg-sky-400" />
      <span aria-hidden className="admin-orb admin-float-slow bottom-[-6rem] right-[-4rem] size-[30rem] bg-blue-500" />
      <svg
        aria-hidden
        className="admin-waves"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(255,255,255,0.35)"
          d="M0,160 C240,110 420,220 720,170 C1000,125 1200,210 1500,160 L1500,320 L0,320 Z"
        />
        <path
          fill="rgba(14,165,233,0.30)"
          d="M0,210 C260,170 480,260 760,215 C1040,170 1240,250 1500,205 L1500,320 L0,320 Z"
        />
        <path
          fill="rgba(3,105,161,0.28)"
          d="M0,255 C300,220 520,300 820,262 C1100,228 1280,290 1500,258 L1500,320 L0,320 Z"
        />
      </svg>
    </>
  );
}
