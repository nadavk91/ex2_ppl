import { AppExp, CExp, Exp, isAppExp, isBoolExp, isDefineExp, isIfExp, isLetExp, isLitExp, isNumExp, isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, LitExp, PrimOp, ProcExp, Program, VarDecl } from '../imp/L3-ast';
import { Result, makeFailure, makeOk } from '../shared/result';


import { isSymbolSExp, isEmptySExp, isCompoundSExp, isClosure, closureToString, compoundSExpToString, Value } from '../imp/L3-value';
import { isNumber, isString } from '../shared/type-predicates';
import { map } from 'ramda';

export const valueToString = (val: Value): string =>
    isNumber(val) ?  val.toString() :
    val === true ? 'True' :
    val === false ? 'False' :
    isString(val) ? `'${val}'` :
    isClosure(val) ? closureToString(val) :
    isPrimOp(val) ? val.op :
    isSymbolSExp(val) ? val.val :
    isEmptySExp(val) ? "" :
    isCompoundSExp(val) ? compoundSExpToString(val) :
    val;

// Add a quote for symbols, empty and compound sexp - strings and numbers are not quoted.
const unparseLitExp = (le: LitExp): string =>
    isEmptySExp(le.val) ? `'()` :
    isSymbolSExp(le.val) ? `'${valueToString(le.val)}` :
    isCompoundSExp(le.val) ? `'${valueToString(le.val)}` :
    `${le.val}`;

const unparseLExps = (les: Exp[]): string =>
    map(unparseL2, les).join("\n");


const isAritmeticOp = (x: string): boolean =>
    ["+", "-", "*", "/", ">", "<", "and", "or", "=", "eq?"].includes(x);

const unparseProcExp = (pe: ProcExp): string => 
    `(lambda ${map((p: VarDecl) => p.var, pe.args).join(",")} : ${unparseL2(pe.body[0])})`

const unparseAritmeticOp = (operator: CExp, operands: CExp[]): string =>
//TODO: edge cases, if only 1 what should we return?
    operands.length ===1 ? unparseL2(operands[0]) :
    `(${unparseL2(operands[0])} ${map((rand:CExp) =>  `${unparseL2(operator)} ${unparseL2(rand)}`, operands.slice(1)).join(" ")})`


const unparsePrimOp = (operator: PrimOp): string =>
    (operator.op == "=" || operator.op == "eq?")? "==":
    (operator.op == "boolean?") ? "(lambda x : (type(x) == bool)":
    (operator.op == "number?") ? "(lambda x : (type(x) == int)":
    operator.op;

const unparseAppExp = (ae: AppExp): string =>
    isPrimOp(ae.rator)? isAritmeticOp(ae.rator.op) ? unparseAritmeticOp(ae.rator, ae.rands):
    (ae.rator.op == "not")? `(not ${unparseL2(ae.rands[0])})`: //TODO: what if the not is with more than 1 operand
    `${unparseL2(ae.rator)}(${map((rand)=> unparseL2(rand), ae.rands).join(",")})`  :
    `${unparseL2(ae.rator)}(${map((rand)=> unparseL2(rand), ae.rands).join(",")})`
    


export const unparseL2 = (exp: Program | Exp): string =>
    isBoolExp(exp) ? valueToString(exp.val) :
    isNumExp(exp) ? valueToString(exp.val) :
    isStrExp(exp) ? valueToString(exp.val) :
    isLitExp(exp) ? unparseLitExp(exp) :
    isVarRef(exp) ? exp.var :
    isProcExp(exp) ? unparseProcExp(exp) :
    isIfExp(exp) ? `(${unparseL2(exp.then)} if ${unparseL2(exp.test)} else ${unparseL2(exp.alt)})` :
    isAppExp(exp) ? unparseAppExp(exp):
    isPrimOp(exp) ? unparsePrimOp(exp) :
    isDefineExp(exp) ? `${exp.var.var} = ${unparseL2(exp.val)}` :
    isProgram(exp) ? `${unparseLExps(exp.exps)}` :
    "";

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    makeOk(unparseL2(exp))
