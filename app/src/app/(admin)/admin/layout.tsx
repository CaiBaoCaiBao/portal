import { Provider } from "./provider";
interface Props extends LayoutProps<"/admin"> {
}

export default function Layout({ children }: Props) {
    return (
        <Provider>
            {children}
        </Provider>
    )
}