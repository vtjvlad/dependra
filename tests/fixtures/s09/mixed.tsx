import React from "react";
import { label } from "./label";

export function Mixed(props: { name: string }) {
  return <div>{label(props.name)}</div>;
}
