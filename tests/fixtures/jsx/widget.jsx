import { label } from "./dep.js";

export function Widget(props) {
  return <div className="w">{label(props.name)}</div>;
}

export default Widget;
