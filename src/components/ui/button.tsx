import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
const styles=cva('btn',{variants:{variant:{default:'primary',outline:'outline',ghost:'ghost',destructive:'danger'},size:{default:'',sm:'small'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof styles>&{asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp className={styles({variant,size,className})} {...props}/>}
