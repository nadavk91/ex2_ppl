import { ClassExp, makeProgram, ProcExp,IfExp,  Exp,makePrimOp, isClassExp, Program, makeProcExp, makeVarDecl, makeIfExp,isProgram, makeBoolExp, BoolExp, Binding, makeAppExp, makeStrExp, makeVarRef, isDefineExp, makeDefineExp, makeClassExp, isLetExp } from "./L31-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { map } from "ramda";
import { CExp, DefineExp, isAppExp, isIfExp, isNumExp, isPrimOp, isVarDecl, isVarRef } from "./L31-ast";
import { isBoolean } from "../shared/type-predicates";
import { isLitExp, makeBinding, makeLetExp, makeLitExp } from "./L31-ast";
import { isProcExp } from "./L31-ast";

/*
Purpose: Transform ClassExp to ProcExp
Signature: for2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>
    makeProcExp(exp.fields, [makeProcExp([makeVarDecl("msg")], 
    [bindingsToIf(exp.methods, "msg")])]);

export const bindingsToIf = (methods: Binding[], msg: string) : IfExp | BoolExp =>
    methods.length===0 ? makeBoolExp(false):
        makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef(msg), makeLitExp("'"+methods[0].var.var)]), 
                makeAppExp(rewriteAllClass(methods[0].val), []),
                bindingsToIf(methods.slice(1), msg));    
            //TODO: what if a is a class instance?


export const rewriteAllClass = (e: CExp): CExp => 
    isBoolean(e) ? e :
    isNumExp(e) ? e :
    isPrimOp(e) ? e :
    isVarRef(e) ? e :
    isVarDecl(e) ? e :
    isLitExp(e) ? e : 
    isLetExp(e) ? makeLetExp(map(binding => makeBinding(binding.var.var ,rewriteAllClass(binding.val)),e.bindings ), map(rewriteAllClass, e.body)):
    isProcExp(e) ? makeProcExp(e.args, map(b=>rewriteAllClass(b), e.body)) :
    isClassExp(e) ? class2proc(e) :
    isAppExp(e) ? makeAppExp(rewriteAllClass(e.rator), map(rewriteAllClass, e.rands)):
    isIfExp(e) ? makeIfExp(rewriteAllClass(e.test),
                               rewriteAllClass(e.then),
                                 rewriteAllClass(e.alt)) : 
                                 e;


                                     
export const rewriteExp = (e: Exp) : Exp =>
    isDefineExp(e)? makeDefineExp(e.var, rewriteAllClass(e.val)): rewriteAllClass(e);
/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp)? makeOk(makeProgram(map((e: Exp)=> rewriteExp(e) , exp.exps))):
        makeOk(rewriteExp(exp));


export const L31ToL33 = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp)? makeOk(makeProgram(map((e: Exp)=> isDefineExp(e)? isClassExp(e.val)? makeDefineExp(e.var, class2proc(e.val)) : e: e, exp.exps))):
        makeOk(isClassExp(exp)? class2proc(exp): exp);
    