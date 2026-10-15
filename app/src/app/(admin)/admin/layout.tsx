interface Props extends LayoutProps<"/admin"> {
}

export default function Layout({ children }: Props) {
    return (
        <div>
            {children}
        </div>
    )
}