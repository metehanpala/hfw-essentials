import * as XRegExpModule from 'xregexp';
const xRegExp = (<any>XRegExpModule).default;

// Rollback named groups breaking changes
// introduced in XREGEXP 5.1.0
xRegExp.uninstall('namespacing');

export class SubstitutionHelper {
    // Initialized once per graphic
    // Example: The expression
    // "A{ Subst 1	 }B{Subst2=def- 2 }C{=123}D{Su.()b=}EE}}F{{FG{X2=X{{Y}}Z}H{X3=Y3}I"
    // should return following 5 substitutions
    //  Subst 1 = ""
    //  Subst2  =   "def- 2 "
    //  Su.()b  =   ""
    //  X2      =   "X{Y}Z"
    //  X3      =   "Y3"
    // The substituted default result should be: "ABdef- 2 C{=123}DEE}F{FGX{Y}ZHY3I"
    private static _regExSubstitution = undefined;
    public static get RegExSubstitution(): any {
        if (SubstitutionHelper._regExSubstitution === undefined) {
            SubstitutionHelper._regExSubstitution = xRegExp('(\
            {{|\
            }}|\
            {\
                \\s*\
                (?<Substitution>(?:\\*|\\w|\\pL|\\pM|\\s|\\.|\\(|\\)|\\#)*)\
                \\s*\
                (?:=(?<Default>(\\{\\{|\\}\\}|[^\\{\\}])*))?\
            }\
            )', 'xg');
        }
        return SubstitutionHelper._regExSubstitution;
    }

    // clean on graphics destroy
    public static Clean(): void
    {
        SubstitutionHelper._regExSubstitution = undefined;
    }

    public static get XRegExp(): any {
        return xRegExp;
    }
}
