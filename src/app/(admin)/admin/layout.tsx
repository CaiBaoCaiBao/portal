import Provider from "./provider";
export default function Layout({ children }: LayoutProps<"/admin">) {
    return (
        <Provider>
            {children}
        </Provider>
    )
}