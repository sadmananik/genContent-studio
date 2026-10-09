import WorkspacePreviews from "./WorkspacePreviews";
import { Check, ImageIcon, PenLine, SearchCheck, WandSparkles } from "lucide-react";

const FEATURE_CHIPS = [
  { label: "AI Writing", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.12)", icon: PenLine },
  {
    label: "Content Improvement",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    icon: WandSparkles
  },
  { label: "SEO Suggestions", color: "#f90c0c", bg: "rgb(245 11 11 / 12%)", icon: SearchCheck },
  {
    label: "AI Image Generation",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    icon: ImageIcon
  }
];

export default function AuthPageLayout({
  children,
  preview = "text-workspace",
  variant = "login"
}) {
  const isSignup = variant === "signup";

  return (
    <section className={`signin-page signin-page-${variant}`}>
      <a className="signin-home-link" href="/">
        ← Back to home
      </a>

      <div className="signin-layout">
        <div className="signin-marketing">
          <span className="signin-pill">
            {isSignup ? "Your next idea starts here" : "Welcome back to your workspace"}
          </span>
          <h1>
            {isSignup ? (
              <>
                Make space for <span>your creativity.</span>
              </>
            ) : (
              <>
                Your ideas. <span>Ready to continue.</span>
              </>
            )}
          </h1>
          <p className="signin-lead">
            {isSignup
              ? "Build your first project, create with AI and bring your team together in one workspace."
              : "Pick up your drafts, refine your writing and keep creating with your AI assistant."}
          </p>

          {isSignup && (
            <ol className="signup-workflow">
              <li>
                <span>01</span>
                <div>
                  <strong>Create your account</strong>
                  <p>Verify your email to get started.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Bring an idea</strong>
                  <p>Start a text or visual project.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Create together</strong>
                  <p>Invite your team and refine in real time.</p>
                </div>
              </li>
            </ol>
          )}
          {!isSignup && (
            <div className="signin-chips">
              {FEATURE_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <span
                    className="signin-chip"
                    key={chip.label}
                    style={{ background: chip.bg, color: chip.color }}
                  >
                    <Icon size={14} />
                    {chip.label}
                  </span>
                );
              })}
            </div>
          )}

          {isSignup ? (
            <div className="signin-preview">
              <WorkspacePreviews preview={preview} priority />
            </div>
          ) : (
            <section className="login-creative-story" aria-label="Example content creation journey">
              <div className="login-story-heading">
                <WandSparkles size={20} aria-hidden="true" />
                <h2>From idea to finished content</h2>
              </div>
              <ol className="login-story-steps">
                <li>
                  <span className="login-story-number">01</span>
                  <div>
                    <strong>A little inspiration</strong>
                    <p className="login-story-prompt">
                      “Write a friendly post about growing herbs at home.”
                    </p>
                  </div>
                </li>
                <li>
                  <span className="login-story-number">02</span>
                  <div>
                    <strong>A fresh first draft</strong>
                    <p>
                      Small space, big flavour. Start your own herb garden with a sunny windowsill
                      and a little care.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="login-story-number">
                    <Check size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Make it your own</strong>
                    <p>Refine the tone, add your ideas and create something worth sharing.</p>
                  </div>
                </li>
              </ol>
              <p className="login-story-caption">Your next great idea is one sign-in away.</p>
            </section>
          )}
        </div>

        <div className="signin-form-wrap">{children}</div>
      </div>
    </section>
  );
}
