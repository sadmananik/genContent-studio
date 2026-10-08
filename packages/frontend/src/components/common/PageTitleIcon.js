export default function PageTitleIcon({ icon: Icon }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
      <Icon aria-hidden="true" size={23} />
    </span>
  );
}
