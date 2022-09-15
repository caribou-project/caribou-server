import 'module-alias/register';
import { addAliases } from 'module-alias';

addAliases({
    "@routes": `${__dirname}/routes/index.ts`,
    "@types": `${__dirname}/types/index.ts`,
    "@services": `${__dirname}/services/index.ts`,
    "@utils": `${__dirname}/utils/index.ts`,
    "@routes/*": `${__dirname}/routes/*`,
    "@types/*": `${__dirname}/types/*`,
    "@services/*": `${__dirname}/services/*`,
    "@utils/*": `${__dirname}/utils/*`
})